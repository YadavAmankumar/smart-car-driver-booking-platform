"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createBooking,
  estimatePricing,
  getRouteDistance,
  parseBackendValidationErrors,
  searchLocations,
  type FareBreakdown,
  type EstimatePricingPayload,
  type EstimatePricingResponse,
  type LocationSuggestion,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from "@/components/ui/primitives";
import { LoadingSpinner, Skeleton } from "@/components/ui/primitives";
import { extractPincode, isLocalPincode } from "@/lib/serviceAreas";

type ServiceType = "Driver Only" | "Car with Driver";
type VehicleAc = "AC" | "Non-AC";
type VehicleCategory =
  | "Mini"
  | "Sedan"
  | "XL – 7 Seater"
  | "Force Traveller";

type BookingFormValues = {
  customerName: string;
  mobileNumber: string;
  email?: string;
  serviceType: ServiceType;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string;
  vehicleAc: VehicleAc;
  vehicleCategory?: VehicleCategory;
  travellerCount?: number;
  requiredDriverHours?: number;
  estimatedKm?: number;
  specialInstructions: string;
  paymentMethod: "Cash" | "UPI";
};

type InlineErrors = Partial<Record<keyof BookingFormValues, string>>;

type BookingSuccess = {
  bookingId?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  estimatedFare?: number;
};

function formatDateYYYYMMDD(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isPhoneValid(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

function formatMoney(amount?: number) {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "-";

  const totalMinutes = Math.round(minutes);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hr${hours === 1 ? "" : "s"} ${remainingMinutes} min`;
}

function coercePositiveInt(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return undefined;
  return n;
}

function classifyTripType(
  pickupLabel: string,
  dropLabel: string,
): "Local" | "Outstation" {
  const pickupPincode = extractPincode(pickupLabel);
  const dropPincode = extractPincode(dropLabel);

  return pickupPincode &&
    dropPincode &&
    isLocalPincode(pickupPincode) &&
    isLocalPincode(dropPincode)
    ? "Local"
    : "Outstation";
}

type SelectCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
};

function SelectCard({
  title,
  description,
  selected,
  onSelect,
}: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        selected
          ? "rounded-xl border border-slate-950 bg-slate-950 px-4 py-3 text-left shadow-md outline-none ring-2 ring-slate-950/10"
          : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            selected
              ? "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950"
              : "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500"
          }
          aria-hidden="true"
        >
          {selected ? "✓" : ""}
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${
              selected ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </p>
          {description ? (
            <p
              className={`mt-1 text-xs ${
                selected ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function BookingForm({
  serviceType,
}: {
  serviceType: ServiceType;
}) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const minBookingDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);

  const maxBookingDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 15);
    return date;
  }, [today]);

  const [values, setValues] = useState<BookingFormValues>({
    customerName: "",
    mobileNumber: "",
    email: "",
    serviceType,
    pickupLocation: "",
    dropLocation: "",
    pickupDate: formatDateYYYYMMDD(minBookingDate),
    pickupTime: "",
    vehicleAc: "AC",
    vehicleCategory: "Sedan",
    travellerCount: 1,
    estimatedKm: undefined,
    specialInstructions: "",
    paymentMethod: "Cash",
  });

  const [inlineErrors, setInlineErrors] = useState<InlineErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(
    null,
  );
  const [successVisible, setSuccessVisible] = useState(false);

  // Pricing state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(
    null,
  );
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    null,
  );
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<LocationSuggestion[]>([]);
  const [pickupSelected, setPickupSelected] = useState<LocationSuggestion | null>(null);
  const [dropSelected, setDropSelected] = useState<LocationSuggestion | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  const debounceTimerRef = useRef<number | null>(null);
  const activeRequestIdRef = useRef(0);
  const submissionRef = useRef(false);

  const derived = useMemo(() => {
    const vehicleCategory =
      values.serviceType === "Car with Driver"
        ? values.vehicleCategory
        : undefined;

    const vehicleAc =
      values.serviceType === "Car with Driver"
        ? values.vehicleAc
        : undefined;

    const estimatedHours =
      values.serviceType === "Driver Only"
        ? coercePositiveInt(values.requiredDriverHours)
        : undefined;

    const estimatedKm =
      values.serviceType === "Car with Driver"
        ? coercePositiveInt(values.estimatedKm)
        : undefined;

    const tripType =
      values.serviceType === "Car with Driver" &&
      pickupSelected &&
      dropSelected
        ? classifyTripType(pickupSelected.label, dropSelected.label)
        : undefined;

    return {
      tripType,
      vehicleCategory,
      vehicleAc,
      estimatedHours,
      estimatedKm,
    };
  }, [
    dropSelected,
    pickupSelected,
    values.estimatedKm,
    values.requiredDriverHours,
    values.serviceType,
    values.vehicleAc,
    values.vehicleCategory,
  ]);

  function validateClientSide(next: BookingFormValues): InlineErrors {
    const e: InlineErrors = {};

    if (!next.customerName.trim()) e.customerName = "Customer name is required";
    if (!next.pickupLocation.trim())
      e.pickupLocation = "Pickup location is required";
    if (!next.dropLocation.trim())
      e.dropLocation = "Drop location cannot be empty";

    if (!next.mobileNumber.trim()) e.mobileNumber = "Phone number is required";
    else if (!isPhoneValid(next.mobileNumber))
      e.mobileNumber = "Please enter a valid mobile number";

    if (!next.pickupDate) {
      e.pickupDate = "Pickup date is required";
    } else {
      const selected = new Date(next.pickupDate + "T00:00:00");

      if (selected <= today) {
        e.pickupDate =
          next.serviceType === "Driver Only"
            ? "Same-day booking is not available. Please book at least 1 day in advance so that our admin team can assign a driver for your trip."
            : "Same-day booking is not available. Please book at least 1 day in advance so that our admin team can assign a driver/car for your trip.";
      } else if (selected > maxBookingDate) {
        e.pickupDate =
          "Booking date not available. You can book only up to 15 days in advance.";
      }
    }

    if (!next.pickupTime.trim()) e.pickupTime = "Pickup time is required";

    if (
      next.serviceType !== "Driver Only" &&
      next.serviceType !== "Car with Driver"
    ) {
      e.serviceType = "Service type is required";
    }

    if (next.serviceType === "Car with Driver") {
      if (!next.vehicleCategory) {
        e.vehicleCategory = "Vehicle category is required";
      }

      if (!next.vehicleAc) {
        e.vehicleAc = "AC / Non-AC selection is required";
      }

      if (!next.travellerCount || next.travellerCount < 1) {
        e.travellerCount = "Number of travellers must be at least 1";
      }

      if (!derived.estimatedKm || derived.estimatedKm < 1) {
        e.estimatedKm = "Estimated kilometers must be greater than 0";
      }
    }

    if (next.serviceType === "Driver Only") {
      if (!derived.estimatedHours || derived.estimatedHours < 1) {
        e.requiredDriverHours =
          "Required Driver Hours must be at least 1 hour.";
      }
    }

    return e;
  }

  function setField<K extends keyof BookingFormValues>(
    key: K,
    value: BookingFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInlineErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
    setBookingSuccess(null);
    setSuccessVisible(false);
  }

  function handlePickupDateChange(value: string) {
    setField("pickupDate", value);

    if (!value || value.length !== 10) return;

    const selected = new Date(value + "T00:00:00");

    if (Number.isNaN(selected.getTime())) {
      setInlineErrors((prev) => ({
        ...prev,
        pickupDate: "Please enter a valid booking date.",
      }));
      return;
    }

    if (selected < today) {
      setInlineErrors((prev) => ({
        ...prev,
        pickupDate:
          "Past dates are not available. Please select a future booking date.",
      }));
      return;
    }

    if (selected.getTime() === today.getTime()) {
      setInlineErrors((prev) => ({
        ...prev,
        pickupDate:
          values.serviceType === "Driver Only"
            ? "Same-day booking is not available. Please book at least 1 day in advance so that our admin team can assign a driver for your trip."
            : "Same-day booking is not available. Please book at least 1 day in advance so that our admin team can assign a driver/car for your trip.",
      }));
      return;
    }

    if (selected > maxBookingDate) {
      setInlineErrors((prev) => ({
        ...prev,
        pickupDate:
          "Booking date not available. You can book only up to 15 days in advance.",
      }));
      return;
    }

    setInlineErrors((prev) => ({
      ...prev,
      pickupDate: undefined,
    }));
  }

  function changeLocation(field: "pickupLocation" | "dropLocation", value: string) {
    setField(field, value);
    if (field === "pickupLocation") { setPickupSelected(null); setPickupSuggestions([]); } else { setDropSelected(null); setDropSuggestions([]); }
    setValues((current) => ({ ...current, estimatedKm: undefined }));
    setRouteDuration(null); setRouteError(null); setFareBreakdown(null); setEstimatedTotal(null);
  }

  useEffect(() => {
    const query = pickupSelected ? values.dropLocation : values.pickupLocation;
    const setSuggestions = pickupSelected ? setDropSuggestions : setPickupSuggestions;
    if (query.trim().length < 3) return;
    const timer = window.setTimeout(() => { void searchLocations(query).then(setSuggestions).catch(() => setRouteError("Unable to search locations. Please try again.")); }, 400);
    return () => window.clearTimeout(timer);
  }, [values.pickupLocation, values.dropLocation, pickupSelected]);

  useEffect(() => {
    if (
      values.serviceType !== "Car with Driver" ||
      !pickupSelected ||
      !dropSelected
    ) {
      return;
    }

    let active = true;

    queueMicrotask(() => {
      if (active) {
        setRouteLoading(true);
        setRouteError(null);
      }
    });

    void getRouteDistance(pickupSelected, dropSelected)
      .then((route) => {
        if (!active) return;

        if (values.serviceType === "Car with Driver") {
          setField("estimatedKm", route.distanceKm);
        }

        setRouteDuration(route.durationMinutes);
      })
      .catch(() => {
        if (active) {
          setRouteError("Unable to calculate a driving route for these locations.");
        }
      })
      .finally(() => {
        if (active) setRouteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [values.serviceType, pickupSelected, dropSelected]);

  const commonPricingInputsReady =
    values.pickupLocation.trim().length > 0 &&
    values.dropLocation.trim().length > 0 &&
    !!values.pickupDate &&
    values.pickupTime.trim().length > 0 &&
    !!values.paymentMethod &&
    !!values.serviceType;
  const pricingInputsReady =
    commonPricingInputsReady &&
    (values.serviceType === "Driver Only"
      ? (coercePositiveInt(derived.estimatedHours) ?? 0) >= 1
      : !!derived.tripType &&
        !!pickupSelected &&
        !!dropSelected &&
        !!derived.vehicleCategory &&
        !!derived.vehicleAc &&
        (coercePositiveInt(derived.estimatedKm) ?? 0) >= 1 &&
        !routeLoading);

    const pricingSucceeded =
    estimateError == null && !estimateLoading && estimatedTotal != null;



  const pricingPayload = useMemo(() => {
    const base: EstimatePricingPayload = {
      pickupLocation: values.pickupLocation.trim(),
      dropLocation: values.dropLocation.trim(),
      serviceType: values.serviceType,
      tripType: derived.tripType,
      vehicleCategory: derived.vehicleCategory,
      vehicleAc: derived.vehicleAc,
      estimatedHours: derived.estimatedHours,
      estimatedKm: derived.estimatedKm,
      bookingDate: values.pickupDate,
      pickupTime: values.pickupTime.trim(),
      paymentMethod: values.paymentMethod,
    };

    return base;
  }, [
    derived.estimatedHours,
    derived.estimatedKm,
    derived.tripType,
    derived.vehicleAc,
    derived.vehicleCategory,
    values.dropLocation,
    values.paymentMethod,
    values.pickupDate,
    values.pickupLocation,
    values.pickupTime,
    values.serviceType,
  ]);

  useEffect(() => {
    // Debounced pricing call
    if (!pricingInputsReady) {
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    // Avoid setting state synchronously on effect mount to satisfy react-hooks lint.
    queueMicrotask(() => {
      setEstimateLoading(true);
      setEstimateError(null);
    });

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const res: EstimatePricingResponse | undefined =
          await estimatePricing(pricingPayload);

        if (activeRequestIdRef.current !== requestId) return;

        const data = res?.data;
        setFareBreakdown(data ?? null);
        setEstimatedTotal(
          typeof data?.estimatedTotal === "number"
            ? data.estimatedTotal
            : typeof data?.baseFare === "number"
              ? data.baseFare
              : null,
        );

        setEstimatedDuration(
          values.serviceType === "Car with Driver"
            ? routeDuration ??
              (typeof data?.estimatedDuration === "number"
                ? data.estimatedDuration
                : null)
            : null,
        );

        setEstimateLoading(false);
      } catch {
        if (activeRequestIdRef.current !== requestId) return;
        setEstimateLoading(false);
        setEstimateError("Unable to estimate fare. Please try again.");
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pricingInputsReady, pricingPayload, routeDuration]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submissionRef.current) return;
    setSubmitError(null);

    const nextInline = validateClientSide(values);
    const hasInline = Object.values(nextInline).some(Boolean);
    setInlineErrors(nextInline);

    if (hasInline) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    const payload = {
      customerName: values.customerName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      email: values.email?.trim() || undefined,
      serviceType: values.serviceType,
      tripType: derived.tripType,
      vehicleCategory: derived.vehicleCategory,
      vehicleAc: derived.vehicleAc,
      travellerCount:
        values.serviceType === "Car with Driver"
          ? values.travellerCount
          : undefined,
      pickupLocation: values.pickupLocation.trim(),
      dropLocation: values.dropLocation.trim(),
      bookingDate: values.pickupDate,
      pickupTime: values.pickupTime.trim(),
      estimatedHours: derived.estimatedHours,
      estimatedKm: derived.estimatedKm,
      paymentMethod: values.paymentMethod,
      notes: values.specialInstructions.trim() || undefined,
    } as const;

    if (estimateLoading) return;
    submissionRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await createBooking(payload);
      if (res.success && res.data) {
          const data = res.data as
            | {
                _id?: string;
                bookingId?: string;
                bookingStatus?: string;
                paymentStatus?: string;
                estimatedFare?: number;
              }
            | undefined;

          setBookingSuccess({
            bookingId: data?._id || data?.bookingId,
            bookingStatus: data?.bookingStatus,
            paymentStatus: data?.paymentStatus,
            estimatedFare:
              typeof data?.estimatedFare === "number"
                ? data.estimatedFare
                : (estimatedTotal ?? undefined),
          });

          setSuccessVisible(true);
          toast.success("Booking created successfully");

          setValues({
            customerName: "",
            mobileNumber: "",
            email: "",
            serviceType,
            pickupLocation: "",
            dropLocation: "",
            pickupDate: formatDateYYYYMMDD(minBookingDate),
            pickupTime: "",
            vehicleAc: "AC",
            vehicleCategory: "Sedan",
            travellerCount: 1,
            requiredDriverHours: undefined,
            estimatedKm: undefined,
            specialInstructions: "",
            paymentMethod: "Cash",
          });

        setInlineErrors({});
        return;
      }
      throw new Error(res.message || "Booking could not be created.");
    } catch (err) {
        const backendErrors = parseBackendValidationErrors(err);
        if (backendErrors.length) {
          const mapped: Record<string, string> = {};
          backendErrors.forEach((be) => {
            if (be.field) mapped[be.field] = be.message;
          });

          const uiMapped: Partial<Record<keyof BookingFormValues, string>> = {
            customerName: mapped.customerName,
            mobileNumber: mapped.mobileNumber,
            pickupLocation: mapped.pickupLocation,
            dropLocation: mapped.dropLocation,
            pickupDate: mapped.bookingDate,
            pickupTime: mapped.pickupTime,
            serviceType: mapped.serviceType,
            vehicleCategory: mapped.vehicleCategory,
            vehicleAc: mapped.vehicleAc,
            travellerCount: mapped.travellerCount,
            requiredDriverHours: mapped.estimatedHours,
            estimatedKm: mapped.estimatedKm,
          };

          setInlineErrors((prev) => ({ ...prev, ...uiMapped }));
          setSubmitError(null);
          toast.error("Booking failed. Check the form errors.");
          return;
        }

        setSubmitError("Something went wrong. Please try again.");
        toast.error("Something went wrong. Please try again.");
    } finally {
      submissionRef.current = false;
      setIsSubmitting(false);
    }
  }

  const confirmDisabled = isSubmitting || estimateLoading || !pricingSucceeded;
  const bookingSummary = [
    {
      label: "Ride Type",
      value:
        values.serviceType === "Driver Only" ? "Driver Only" : "Car + Driver",
    },
    ...(values.serviceType === "Driver Only"
      ? [
          {
            label: "Booked Hours",
            value:
              derived.estimatedHours != null
                ? `${derived.estimatedHours} hrs`
                : "-",
          },
        ]
      : [
          { label: "Vehicle Category", value: values.vehicleCategory ?? "-" },
          { label: "AC / Non-AC", value: values.vehicleAc },
          { label: "Estimated Distance", value: `${values.estimatedKm ?? "-"} km` },
          {
            label: "Estimated Duration",
            value:
              estimatedDuration != null
                ? formatDuration(estimatedDuration)
                : "-",
          },
        ]),
    { label: "Payment Method", value: values.paymentMethod },
    { label: "Pickup", value: values.pickupLocation || "-" },
    { label: "Drop", value: values.dropLocation || "-" },
  ];


  if (bookingSuccess && successVisible) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-[#0F172A]">
                Booking Confirmed
              </h2>
              <p className="text-sm text-[#64748B]">
                Your ride has been booked successfully.
              </p>

              <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">
                      Booking ID
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0F172A]">
                      {bookingSuccess.bookingId || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">
                      Booking Status
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0F172A]">
                      {bookingSuccess.bookingStatus || "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">
                      Payment Status
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0F172A]">
                      {bookingSuccess.paymentStatus || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">
                      Estimated Fare
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0F172A]">
                      {estimatedTotal != null
                        ? formatMoney(estimatedTotal)
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-lg"
                  onClick={() => window.location.assign("/")}
                >
                  Go Home
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-lg"
                  onClick={() => window.location.assign("/dashboard/customer")}
                >
                  Customer Dashboard
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-lg"
                  onClick={() => window.location.assign("/bookings")}
                >
                  My Bookings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_360px]">
            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Customer Details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the details we can use to contact you about this booking.
                  </p>
                </div>
                <Button asChild type="button" variant="secondary" size="sm">
                  <Link href="/booking">Change Service</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Customer Name *
                  </label>
                  <Input
                    value={values.customerName}
                    onChange={(ev) => setField("customerName", ev.target.value)}
                    placeholder="Amankumar"
                    aria-invalid={!!inlineErrors.customerName}
                  />
                  {inlineErrors.customerName ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.customerName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Phone Number *
                  </label>
                  <Input
                    value={values.mobileNumber}
                    onChange={(ev) => setField("mobileNumber", ev.target.value)}
                    placeholder="6xxxxxxxxx"
                    inputMode="numeric"
                    aria-invalid={!!inlineErrors.mobileNumber}
                  />
                  {inlineErrors.mobileNumber ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.mobileNumber}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Email (optional)
                  </label>
                  <Input
                    value={values.email}
                    onChange={(ev) => setField("email", ev.target.value)}
                    placeholder="amankumar@example.com"
                    inputMode="email"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Pickup Location *
                  </label>
                  <Input
                    value={values.pickupLocation}
                    onChange={(ev) => changeLocation("pickupLocation", ev.target.value)}
                    placeholder="Search pickup location"
                    aria-invalid={!!inlineErrors.pickupLocation}
                  />
                  {inlineErrors.pickupLocation ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.pickupLocation}
                    </p>
                  ) : null}
                  {!pickupSelected && pickupSuggestions.length > 0 ? <div className="mt-2 max-h-40 overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">{pickupSuggestions.map((location) => <button key={location.id} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-slate-50" onClick={() => { setPickupSelected(location); setField("pickupLocation", location.label); setPickupSuggestions([]); }}>{location.label}</button>)}</div> : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Drop Location *
                  </label>
                  <Input
                    value={values.dropLocation}
                    onChange={(ev) => changeLocation("dropLocation", ev.target.value)}
                    placeholder="Search drop location"
                    aria-invalid={!!inlineErrors.dropLocation}
                  />
                  {inlineErrors.dropLocation ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.dropLocation}
                    </p>
                  ) : null}
                  {!dropSelected && dropSuggestions.length > 0 ? <div className="mt-2 max-h-40 overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">{dropSuggestions.map((location) => <button key={location.id} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-slate-50" onClick={() => { setDropSelected(location); setField("dropLocation", location.label); setDropSuggestions([]); }}>{location.label}</button>)}</div> : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Pickup Date *
                  </label>
                  <Input
                    type="date"
                    value={values.pickupDate}
                    min={formatDateYYYYMMDD(minBookingDate)}
                    max={formatDateYYYYMMDD(maxBookingDate)}
                    onChange={(ev) => handlePickupDateChange(ev.target.value)}
                  />
                  {inlineErrors.pickupDate ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.pickupDate}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Pickup Time *
                  </label>
                  <Input
                    type="time"
                    value={values.pickupTime}
                    onChange={(ev) => setField("pickupTime", ev.target.value)}
                    aria-invalid={!!inlineErrors.pickupTime}
                  />
                  {inlineErrors.pickupTime ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.pickupTime}
                    </p>
                  ) : null}
                </div>

                {values.serviceType === "Car with Driver" ? (
                  <>
                    <div className="md:col-span-2 pt-2">
                      <div className="mb-3">
                        <h2 className="text-base font-bold text-slate-900">
                          Vehicle Preference
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Select your vehicle category and AC / Non-AC preference.
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#0F172A]">
                        Vehicle Category *
                      </label>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SelectCard
                          title="Mini"
                          selected={values.vehicleCategory === "Mini"}
                          onSelect={() => setField("vehicleCategory", "Mini")}
                          description="Compact option for smaller groups."
                        />
                        <SelectCard
                          title="Sedan"
                          selected={values.vehicleCategory === "Sedan"}
                          onSelect={() => setField("vehicleCategory", "Sedan")}
                          description="Comfortable option for everyday travel."
                        />
                        <SelectCard
                          title="XL – 7 Seater"
                          selected={values.vehicleCategory === "XL – 7 Seater"}
                          onSelect={() =>
                            setField("vehicleCategory", "XL – 7 Seater")
                          }
                          description="More space for larger groups."
                        />
                        <SelectCard
                          title="Force Traveller"
                          selected={values.vehicleCategory === "Force Traveller"}
                          onSelect={() =>
                            setField("vehicleCategory", "Force Traveller")
                          }
                          description="Large option for group journeys and tours."
                        />
                      </div>
                      {inlineErrors.vehicleCategory ? (
                        <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                          {inlineErrors.vehicleCategory}
                        </p>
                      ) : null}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#0F172A]">
                        AC / Non-AC *
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <SelectCard
                          title="AC"
                          selected={values.vehicleAc === "AC"}
                          onSelect={() => setField("vehicleAc", "AC")}
                          description="Cool and comfortable."
                        />
                        <SelectCard
                          title="Non-AC"
                          selected={values.vehicleAc === "Non-AC"}
                          onSelect={() => setField("vehicleAc", "Non-AC")}
                          description="Budget-friendly option."
                        />
                      </div>
                      {inlineErrors.vehicleAc ? (
                        <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                          {inlineErrors.vehicleAc}
                        </p>
                      ) : null}
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                        Number of Travellers *
                      </label>
                      <p className="mb-2 text-xs text-[#64748B]">
                        How many people will be travelling?
                      </p>
                      <Input
                        type="number"
                        min={1}
                        value={values.travellerCount ?? 1}
                        onChange={(ev) =>
                          setField(
                            "travellerCount",
                            Math.max(1, Number(ev.target.value) || 1),
                          )
                        }
                        aria-invalid={!!inlineErrors.travellerCount}
                      />
                      {inlineErrors.travellerCount ? (
                        <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                          {inlineErrors.travellerCount}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                      Required Driver Hours *
                    </label>
                    <p className="mb-2 text-xs text-[#64748B]">
                      Select the number of hours you need a professional driver.
                    </p>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={values.requiredDriverHours ?? ""}
                      onChange={(ev) =>
                        setField(
                          "requiredDriverHours",
                          ev.target.value === ""
                            ? undefined
                            : Math.max(1, Number(ev.target.value) || 1),
                        )
                      }
                      aria-invalid={!!inlineErrors.requiredDriverHours}
                    />
                    {inlineErrors.requiredDriverHours ? (
                      <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                        {inlineErrors.requiredDriverHours}
                      </p>
                    ) : null}
                  </div>
                )}

                {values.serviceType === "Car with Driver" ? (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                      Route distance
                    </label>
                    <Input
                      readOnly
                      value={
  routeLoading
    ? "Calculating route…"
    : values.estimatedKm
      ? `${values.estimatedKm} KM${routeDuration ? ` · ~${formatDuration(routeDuration)}` : ""}`
      : "Select pickup and drop locations"
}
                    />
                    {routeError || inlineErrors.estimatedKm ? (
                      <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                        {routeError || inlineErrors.estimatedKm}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {values.serviceType === "Car with Driver" &&
                derived.tripType ? (
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Trip Type: {derived.tripType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Based on your pickup and drop locations.
                    </p>
                  </div>
                ) : null}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["Cash", "UPI"] as const).map((pm) => (
                      <SelectCard
                        key={pm}
                        title={pm === "UPI" ? "UPI QR" : pm}
                        selected={values.paymentMethod === pm}
                        onSelect={() => setField("paymentMethod", pm)}
                        description={
                          pm === "Cash"
                            ? "Pay the assigned driver after trip completion."
                            : "Select UPI and ask the driver for the correct QR code. Scan the QR provided by the driver and complete the payment. The driver will verify the payment before completing the trip."
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Additional Instructions
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Add any pickup, travel, or driver-related information.
                    </p>
                  </div>

                  <Textarea
                    value={values.specialInstructions}
                    onChange={(ev) =>
                      setField("specialInstructions", ev.target.value)
                    }
                    placeholder="Example: Please call me when the driver arrives."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {submitError ? (
                <p className="mt-4 text-sm text-[#DC2626]" role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                {estimateError ? (
                  <div className="flex-1">
                    <Alert tone="danger" title="Pricing failed">
                      {estimateError}
                    </Alert>
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-lg"
                        onClick={() => {
                          // Retry is handled by triggering a new estimate via request id.
                          activeRequestIdRef.current =
                            activeRequestIdRef.current + 1;
                          setEstimateLoading(true);
                          setEstimateError(null);

                          const requestId = activeRequestIdRef.current;
                          estimatePricing(pricingPayload)
                            .then((res: EstimatePricingResponse | undefined) => {
                              if (activeRequestIdRef.current !== requestId)
                                return;

                              const data = res?.data;
                              setFareBreakdown(data ?? null);
                              setEstimatedTotal(
                                typeof data?.estimatedTotal === "number"
                                  ? data.estimatedTotal
                                  : typeof data?.baseFare === "number"
                                    ? data.baseFare
                                    : null,
                              );
                              setEstimatedDuration(
                                typeof data?.estimatedDuration ===
                                "number"
                                  ? data?.estimatedDuration
                                  : null,
                              );
                              setEstimateLoading(false);
                            })
                            .catch(() => {
                              if (activeRequestIdRef.current !== requestId)
                                return;
                              setEstimateLoading(false);
                              setEstimateError(
                                "Unable to estimate fare. Please try again.",
                              );
                            });
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={confirmDisabled}
                  className="h-11 min-w-32 rounded-lg bg-slate-950 px-6 font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmDisabled ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner />
                      {isSubmitting ? "Booking..." : "Estimating..."}
                    </span>
                  ) : (
                    "Book Now"
                  )}
                </Button>
              </div>

            </div>

            <div className="sticky top-6 space-y-4 p-0 md:block">
              <div className="p-3">
                <h3 className="sr-only">Fare Breakdown</h3>
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-base font-bold text-slate-900">
                          Fare Breakdown
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Your estimated trip cost based on the selected service.
                        </p>
                      </div>
                      {estimateLoading ? (
                        <Badge tone="neutral">Calculating</Badge>
                      ) : estimatedTotal != null ? (
                        <Badge tone="neutral">Estimated</Badge>
                      ) : null}
                    </div>

                    {values.serviceType === "Driver Only" ? (
                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Booked-hours Charge
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Based on your selected trip details
                            </p>
                          </div>

                          <div className="text-right">
                            {estimateLoading ? (
                              <Skeleton className="h-7 w-24" />
                            ) : estimatedTotal != null ? (
                              <p className="text-2xl font-bold tracking-tight text-slate-950">
                                {formatMoney(estimatedTotal)}
                              </p>
                            ) : (
                              <p className="text-2xl font-bold text-slate-400">
                                —
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold text-[#64748B]">
                            Hourly Rate
                          </span>
                          <span className="text-right font-semibold text-[#0F172A]">
                            {typeof (fareBreakdown ?? {}) === "object" &&
                            typeof (fareBreakdown as { hourlyRate?: number })
                              ?.hourlyRate === "number"
                              ? formatMoney(
                                  (fareBreakdown as { hourlyRate?: number })
                                    .hourlyRate,
                                )
                              : "-"}





                          </span>

                        </div>



                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold text-[#64748B]">
                            Booked Hours
                          </span>
                          <span className="text-right font-semibold text-[#0F172A]">
                            {estimateLoading ? (
                              <Skeleton className="h-4 w-20" />
                            ) : derived.estimatedHours != null ? (
                              `${derived.estimatedHours} hrs`
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#0F172A]">
                              Estimated Total
                            </p>
                            {estimateLoading ? (
                              <Skeleton className="h-5 w-28" />
                            ) : (
                              <p className="text-lg font-extrabold text-[#0F172A]">
                                {estimatedTotal != null
                                  ? formatMoney(estimatedTotal)
                                  : "-"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          {(
                            [
                              ["Base Fare", fareBreakdown?.baseFare],
                              [
                                "Distance Charge",
                                fareBreakdown?.distanceCharge,
                              ],
                              [
                                "Waiting Charge",
                                fareBreakdown?.waitingCharge,
                              ],
                              ["Night Charge", fareBreakdown?.nightCharge],
                              [
                                "Weekend Charge",
                                fareBreakdown?.weekendCharge,
                              ],
                              ["GST", fareBreakdown?.gst],
                            ] as const
                          ).map(([label, v]) => (
                            <div key={label}>
                              <p className="text-xs text-[#64748B]">
                                {label}
                              </p>
                              {estimateLoading ? (
                                <Skeleton className="mt-1 h-4 w-20" />
                              ) : (
                                <p className="mt-1 font-semibold text-[#0F172A]">
                                  {typeof v === "number" ? formatMoney(v) : "-"}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#0F172A]">
                              Estimated Total
                            </p>
                            {estimateLoading ? (
                              <Skeleton className="h-5 w-28" />
                            ) : (
                              <p className="text-lg font-extrabold text-[#0F172A]">
                                {estimatedTotal != null
                                  ? formatMoney(estimatedTotal)
                                  : "-"}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}


                    {estimateError ? (
                      <div className="mt-3">
                        <Alert tone="danger" title="Pricing failed">
                          {estimateError}
                        </Alert>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <div className="p-3">
                <h3 className="sr-only">Booking Summary</h3>
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <p className="text-sm font-bold text-[#0F172A]">
                      Booking Summary
                    </p>
                    <div className="mt-3 space-y-3 text-sm">
                      {bookingSummary.map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-4"
                        >
                          <span className="text-xs font-semibold text-[#64748B]">
                            {label}
                          </span>
                          <span className="max-w-[60%] text-right font-semibold text-[#0F172A]">
                            {estimateLoading &&
                            label !== "Pickup" &&
                            label !== "Drop" ? (
                              <Skeleton className="ml-auto h-4 w-24" />
                            ) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 md:hidden">
        <div className="space-y-4">
          {/* Stacked cards on small screens */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-[#0F172A]">Fare Breakdown</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Estimated fare. Final fare may vary depending on actual trip
                conditions.
              </p>
              {values.serviceType === "Driver Only" ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Booked-hours Charge
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Based on your selected trip details
                      </p>
                    </div>

                    <div className="text-right">
                      {estimateLoading ? (
                        <Skeleton className="h-7 w-24" />
                      ) : estimatedTotal != null ? (
                        <p className="text-2xl font-bold text-slate-950">
                          {formatMoney(estimatedTotal)}
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-slate-400">
                          —
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Hourly Rate
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {typeof (fareBreakdown ?? {}) === "object" &&
                      typeof (fareBreakdown as { hourlyRate?: number })
                        ?.hourlyRate === "number"
                        ? formatMoney(
                            (fareBreakdown as { hourlyRate?: number })
                              .hourlyRate,
                          )
                        : "-"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Booked Hours
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {estimateLoading
                        ? "-"
                        : derived.estimatedHours != null
                          ? `${derived.estimatedHours} hrs`
                          : "-"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Estimated Total
                      </p>
                      {estimateLoading ? (
                        <Skeleton className="h-5 w-28" />
                      ) : (
                        <p className="text-lg font-extrabold text-[#0F172A]">
                          {estimatedTotal != null
                            ? formatMoney(estimatedTotal)
                            : "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {(
                    [
                      ["Base Fare", fareBreakdown?.baseFare],
                      ["Distance", fareBreakdown?.distanceCharge],
                      ["Waiting", fareBreakdown?.waitingCharge],
                      ["Night", fareBreakdown?.nightCharge],
                      ["Weekend", fareBreakdown?.weekendCharge],
                      ["GST", fareBreakdown?.gst],
                    ] as const
                  ).map(([label, v]) => (
                    <div key={label}>
                      <p className="text-xs text-[#64748B]">{label}</p>
                      {estimateLoading ? (
                        <Skeleton className="mt-1 h-4 w-16" />
                      ) : (
                        <p className="mt-1 font-semibold text-[#0F172A]">
                          {typeof v === "number" ? formatMoney(v) : "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-[#0F172A]">
                Booking Summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {bookingSummary.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4"
                  >
                    <span className="text-xs font-semibold text-[#64748B]">
                      {label}
                    </span>
                    <span className="max-w-[60%] text-right font-semibold text-[#0F172A]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
