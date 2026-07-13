"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createBooking,
  estimatePricing,
  parseBackendValidationErrors,
  type FareBreakdown,
  type EstimatePricingPayload,
  type EstimatePricingResponse,
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

type ServiceType = "Driver Only" | "Car with Driver";
type CarType = "AC" | "Non-AC";

type BookingFormValues = {
  customerName: string;
  mobileNumber: string;
  email?: string;
  serviceType: ServiceType;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string;
  vehicleType: CarType; // UI label (AC/Non-AC)

  // Driver Only: Estimated Hours (kept in this field name to avoid changing
  // payload mapping / backend request shape).
  numberOfPassengers: number;
  specialInstructions: string;

  carType?: CarType;
  estimatedHours?: number;
  estimatedKm?: number;

  paymentMethod: "Cash" | "Online";
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

function coercePositiveInt(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  if (i < 1) return undefined;
  return i;
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
          ? "rounded-xl border border-[#2563EB] bg-[#EFF6FF] px-4 py-3 text-left shadow-sm outline-none ring-2 ring-[#2563EB]/20"
          : "rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left shadow-sm transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            selected
              ? "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#1D4ED8]"
              : "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-[#475569]"
          }
          aria-hidden="true"
        >
          {selected ? "✓" : ""}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-[#64748B]">{description}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function BookingForm() {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [values, setValues] = useState<BookingFormValues>({
    customerName: "",
    mobileNumber: "",
    email: "",
    serviceType: "Driver Only",
    pickupLocation: "",
    dropLocation: "",
    pickupDate: formatDateYYYYMMDD(today),
    pickupTime: "",
    vehicleType: "AC",
    numberOfPassengers: 1,
    specialInstructions: "",

    carType: "AC",
    estimatedHours: 1,
    estimatedKm: 1,
    paymentMethod: "Cash",
  });

  const [inlineErrors, setInlineErrors] = useState<InlineErrors>({});
  const [isPending, startTransition] = useTransition();
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

  const debounceTimerRef = useRef<number | null>(null);
  const activeRequestIdRef = useRef(0);

  const vehicleType = values.vehicleType;

  const derived = useMemo(() => {
    const carType =
      values.serviceType === "Car with Driver" ? vehicleType : undefined;

    const estimatedHours =
      values.serviceType === "Driver Only"
        ? Math.max(1, Number(values.numberOfPassengers) || 1)
        : undefined;

    // Distance (km) is not user-entered in this UI (no maps yet).
    const estimatedKm = undefined;

    return { carType, estimatedHours, estimatedKm };
  }, [values.numberOfPassengers, values.serviceType, vehicleType]);

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

    if (!next.pickupDate) e.pickupDate = "Pickup date is required";
    else {
      const selected = new Date(next.pickupDate + "T00:00:00");
      if (selected < today) e.pickupDate = "Pickup date cannot be in the past";
    }

    if (!next.pickupTime.trim()) e.pickupTime = "Pickup time is required";

    if (
      next.serviceType !== "Driver Only" &&
      next.serviceType !== "Car with Driver"
    ) {
      e.serviceType = "Service type is required";
    }

    if (next.serviceType === "Car with Driver" && !next.vehicleType) {
      e.vehicleType = "Car type is required for Car with Driver service";
    }

    if (next.serviceType === "Driver Only") {
      if (!derived.estimatedHours || derived.estimatedHours < 1) {
        e.numberOfPassengers = "Estimated hours are required";
      }
    }

    if (next.serviceType === "Car with Driver") {
      if (!derived.estimatedKm || derived.estimatedKm < 1) {
        e.numberOfPassengers = "Estimated kilometers are required";
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

  const pricingInputsReady =
    values.pickupLocation.trim().length > 0 &&
    values.dropLocation.trim().length > 0 &&
    !!values.pickupDate &&
    values.pickupTime.trim().length > 0 &&
    !!values.paymentMethod &&
    !!values.serviceType &&
    values.serviceType === "Driver Only"
      ? (coercePositiveInt(derived.estimatedHours) ?? 0) >= 1
      : true;

    const pricingSucceeded =
    estimateError == null && !estimateLoading && estimatedTotal != null;



  const pricingPayload = useMemo(() => {
    const base: EstimatePricingPayload = {
      pickupLocation: values.pickupLocation.trim(),
      dropLocation: values.dropLocation.trim(),
      serviceType: values.serviceType,
      carType: derived.carType,
      estimatedHours: derived.estimatedHours,
      bookingDate: values.pickupDate,
      pickupTime: values.pickupTime.trim(),
      // Backend expects "Cash" | "UPI" | "Card" | "Net Banking".
      // UI uses "Cash" | "Online".
      paymentMethod: values.paymentMethod === "Cash" ? "Cash" : "UPI",
    };

    // Backend typing expects estimatedHours only for Driver Only.
    // For Car with Driver, backend likely uses estimatedKm but the payload typing here may not include it.
    // We keep payload flexible by attaching estimatedKm if present.
    // Distance (km) is not user-entered in this UI (no maps yet).
    // Keep request payload compatible with backend even if TypeScript typing is stricter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      ...base,
    };

    return payload;
  }, [
    derived.carType,
    derived.estimatedHours,
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
          typeof data?.estimatedDuration === "number"
            ? data?.estimatedDuration
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
  }, [pricingInputsReady, pricingPayload]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const nextInline = validateClientSide(values);
    const hasInline = Object.values(nextInline).some(Boolean);
    setInlineErrors(nextInline);

    if (hasInline) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    // Backend paymentMethod enum is fixed; map UI option -> backend option.
    // Online (QR Scanner) is represented as UPI in the existing backend.
    const backendPaymentMethod: "Cash" | "UPI" | "Card" | "Net Banking" =
      values.paymentMethod === "Cash" ? "Cash" : "UPI";

    const payload = {
      customerName: values.customerName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      email: values.email?.trim() || undefined,
      serviceType: values.serviceType,
      carType: derived.carType,
      pickupLocation: values.pickupLocation.trim(),
      dropLocation: values.dropLocation.trim(),
      bookingDate: values.pickupDate,
      pickupTime: values.pickupTime.trim(),
      estimatedHours: derived.estimatedHours,
      // No manual distance input yet.
      estimatedKm: undefined,
      paymentMethod: backendPaymentMethod,
      notes: values.specialInstructions.trim() || undefined,
    } as const;

    startTransition(async () => {
      try {
        if (estimateLoading) return;
        const res = await createBooking(payload);
        if (res?.success) {
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
            serviceType: "Driver Only",
            pickupLocation: "",
            dropLocation: "",
            pickupDate: formatDateYYYYMMDD(today),
            pickupTime: "",
            vehicleType: "AC",
            numberOfPassengers: 1,
            specialInstructions: "",
            carType: "AC",
            estimatedHours: 1,
            estimatedKm: 1,
            paymentMethod: "Cash",
          });

          setInlineErrors({});
        }
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
            vehicleType: mapped.carType,
          };

          setInlineErrors((prev) => ({ ...prev, ...uiMapped }));
          setSubmitError(null);
          toast.error("Booking failed. Check the form errors.");
          return;
        }

        setSubmitError("Something went wrong. Please try again.");
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  const confirmDisabled = isPending || estimateLoading || !pricingSucceeded;


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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Customer Name *
                  </label>
                  <Input
                    value={values.customerName}
                    onChange={(ev) => setField("customerName", ev.target.value)}
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    inputMode="email"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A]">
                        Service Type *
                      </label>
                      <p className="mt-1 text-xs text-[#64748B]">
                        Choose the ride option that matches how you want to
                        travel.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SelectCard
                      title="Driver Only"
                      description="For when you already have a car."
                      selected={values.serviceType === "Driver Only"}
                      onSelect={() => setField("serviceType", "Driver Only")}
                    />
                    <SelectCard
                      title="Car + Driver"
                      description="We arrange both car and driver."
                      selected={values.serviceType === "Car with Driver"}
                      onSelect={() =>
                        setField("serviceType", "Car with Driver")
                      }
                    />
                  </div>
                  {inlineErrors.serviceType ? (
                    <p className="mt-2 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.serviceType}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Pickup Location *
                  </label>
                  <Input
                    value={values.pickupLocation}
                    onChange={(ev) =>
                      setField("pickupLocation", ev.target.value)
                    }
                    placeholder="City, Address"
                    aria-invalid={!!inlineErrors.pickupLocation}
                  />
                  {inlineErrors.pickupLocation ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.pickupLocation}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Drop Location *
                  </label>
                  <Input
                    value={values.dropLocation}
                    onChange={(ev) => setField("dropLocation", ev.target.value)}
                    placeholder="City, Address"
                    aria-invalid={!!inlineErrors.dropLocation}
                  />
                  {inlineErrors.dropLocation ? (
                    <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                      {inlineErrors.dropLocation}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Pickup Date *
                  </label>
                  <Input
                    type="date"
                    value={values.pickupDate}
                    min={formatDateYYYYMMDD(today)}
                    onChange={(ev) => setField("pickupDate", ev.target.value)}
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

                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A]">
                        AC / Non-AC *
                      </label>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {values.serviceType === "Car with Driver"
                          ? "Your AC / Non-AC preference will be applied."
                          : "You can select AC / Non-AC now—this will apply when choosing Car + Driver."}
                      </p>
                    </div>
                    {values.serviceType === "Car with Driver" ? (
                      <Badge tone="blue">Preference active</Badge>
                    ) : (
                      <Badge tone="neutral">Preference saved</Badge>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <SelectCard
                      title="AC"
                      selected={values.vehicleType === "AC"}
                      onSelect={() => setField("vehicleType", "AC")}
                      description="Cool and comfortable."
                    />
                    <SelectCard
                      title="Non-AC"
                      selected={values.vehicleType === "Non-AC"}
                      onSelect={() => setField("vehicleType", "Non-AC")}
                      description="Budget-friendly option."
                    />
                  </div>
                </div>

                {values.serviceType === "Driver Only" ? (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                      Estimated Hours *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={values.numberOfPassengers}
                      onChange={(ev) =>
                        setField(
                          "numberOfPassengers",
                          Math.max(1, Number(ev.target.value) || 1),
                        )
                      }
                      aria-invalid={!!inlineErrors.numberOfPassengers}
                    />
                    {inlineErrors.numberOfPassengers ? (
                      <p className="mt-1 text-sm text-[#DC2626]" role="alert">
                        {inlineErrors.numberOfPassengers}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["Cash", "Online"] as const).map((pm) => (
                      <SelectCard
                        key={pm}
                        title={pm === "Online" ? "Online (QR Scanner)" : pm}
                        selected={values.paymentMethod === pm}
                        onSelect={() => setField("paymentMethod", pm)}
                        description={
                          pm === "Cash"
                            ? "Pay at ride end."
                            : "Scan & pay securely."
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                    Special Instructions
                  </label>
                  <Textarea
                    value={values.specialInstructions}
                    onChange={(ev) =>
                      setField("specialInstructions", ev.target.value)
                    }
                    placeholder="Anything we should know?"
                    rows={4}
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
                  className="rounded-lg"
                >
                  {confirmDisabled ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner />
                      {isPending ? "Booking..." : "Estimating..."}
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">
                          Fare Breakdown
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Estimated fare. Final fare may vary depending on
                          actual trip conditions.
                        </p>
                      </div>
                      {estimateLoading ? (
                        <Badge tone="blue">Estimating</Badge>
                      ) : estimatedTotal != null ? (
                        <Badge tone="green">Ready</Badge>
                      ) : null}
                    </div>

                    {values.serviceType === "Driver Only" ? (
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold text-[#64748B]">
                            Estimated Cost
                          </span>
                          <span className="text-right font-semibold text-[#0F172A]">
                            {estimateLoading ? (
                              <Skeleton className="h-4 w-24" />
                            ) : estimatedTotal != null ? (
                              formatMoney(estimatedTotal)
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold text-[#64748B]">
                            ₹ / Hour
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
                            Estimated Hours
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
                              [
                                "Airport Charge",
                                fareBreakdown?.airportCharge,
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
                      {(
                        [
                          [
                            "Ride Type",
                            values.serviceType === "Driver Only"
                              ? "Driver Only"
                              : "Car + Driver",
                          ],
                          [
                            "Vehicle Type",
                            values.serviceType === "Car with Driver"
                              ? values.vehicleType
                              : values.vehicleType,
                          ],
                          ["AC / Non-AC", values.vehicleType],
                          [
                            "Estimated Hours",
                            values.serviceType === "Driver Only"
                              ? values.numberOfPassengers
                              : undefined,
                          ],
                          [
                            "Estimated Duration",
                            estimatedDuration != null
                              ? `${estimatedDuration} mins`
                              : undefined,
                          ],
                          ["Payment Method", values.paymentMethod],
                          ["Pickup", values.pickupLocation || undefined],
                          ["Drop", values.dropLocation || undefined],
                        ] as const
                      ).map(([label, val]) => (
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
                            ) : typeof val === "string" ? (
                              val
                            ) : (
                              "-"
                            )}
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
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#64748B]">
                  Estimated Total
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#0F172A]">
                  {estimateLoading
                    ? "-"
                    : estimatedTotal != null
                      ? formatMoney(estimatedTotal)
                      : "-"}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {(
                  [
                    ["Base Fare", fareBreakdown?.baseFare],
                    ["Distance", fareBreakdown?.distanceCharge],
                    ["Waiting", fareBreakdown?.waitingCharge],
                    ["Airport", fareBreakdown?.airportCharge],
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-[#0F172A]">
                Booking Summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {(
                  [
                    [
                      "Ride Type",
                      values.serviceType === "Driver Only"
                        ? "Driver Only"
                        : "Car + Driver",
                    ],
                    ["Vehicle Type", values.vehicleType],
                    ["AC / Non-AC", values.vehicleType],
                    [
                      "Estimated Hours",
                      values.serviceType === "Driver Only"
                        ? `${values.numberOfPassengers} hrs`
                        : "-",
                    ],
                    [
                      "Estimated Distance",
                      values.serviceType === "Car with Driver"
                        ? `${values.numberOfPassengers} km`
                        : "-",
                    ],
                    [
                      "Estimated Duration",
                      estimatedDuration != null
                        ? `${estimatedDuration} mins`
                        : "-",
                    ],
                    ["Payment Method", values.paymentMethod],
                    ["Pickup", values.pickupLocation || "-"],
                    ["Drop", values.dropLocation || "-"],
                  ] as const
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4"
                  >
                    <span className="text-xs font-semibold text-[#64748B]">
                      {label}
                    </span>
                    <span className="max-w-[60%] text-right font-semibold text-[#0F172A]">
                      {val}
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
