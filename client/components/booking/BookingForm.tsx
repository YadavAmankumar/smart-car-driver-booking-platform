"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking, parseBackendValidationErrors } from "@/lib/api";
import toast from "react-hot-toast";

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
  vehicleType: CarType; // UI label
  numberOfPassengers: number;
  specialInstructions: string;

  // Backend fields (derived)
  carType?: CarType;
  estimatedHours?: number;
  estimatedKm?: number;
  paymentMethod: "Cash" | "UPI" | "Card" | "Net Banking";
};

type InlineErrors = Partial<Record<keyof BookingFormValues, string>>;

function formatDateYYYYMMDD(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isPhoneValid(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

export default function BookingForm() {
  const today = useMemo(() => {
    const now = new Date();
    // Use local timezone date.
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

  const vehicleType = values.vehicleType;

  const derived = useMemo(() => {
    // Backend expects:
    // - serviceType: "Driver Only" | "Car with Driver"
    // - carType required only for "Car with Driver"
    // - estimatedHours required only for "Driver Only"
    // - estimatedKm required only for "Car with Driver"
    const carType = values.serviceType === "Car with Driver" ? vehicleType : undefined;

    // Backend does not accept passengers; we map to backend estimations crudely.
    // Keep aligned to backend validation (min 1).
    const estimatedHours =
      values.serviceType === "Driver Only"
        ? Math.max(1, Number(values.numberOfPassengers) || 1)
        : undefined;

    const estimatedKm =
      values.serviceType === "Car with Driver"
        ? Math.max(1, Number(values.numberOfPassengers) || 1)
        : undefined;

    return { carType, estimatedHours, estimatedKm };
  }, [values.numberOfPassengers, values.serviceType, vehicleType]);

  function validateClientSide(next: BookingFormValues): InlineErrors {
    const e: InlineErrors = {};

    if (!next.customerName.trim()) e.customerName = "Customer name is required";
    if (!next.pickupLocation.trim()) e.pickupLocation = "Pickup location is required";
    if (!next.dropLocation.trim()) e.dropLocation = "Drop location cannot be empty";

    if (!next.mobileNumber.trim()) e.mobileNumber = "Phone number is required";
    else if (!isPhoneValid(next.mobileNumber))
      e.mobileNumber = "Please enter a valid mobile number";

    if (!next.pickupDate) e.pickupDate = "Pickup date is required";
    else {
      const selected = new Date(next.pickupDate + "T00:00:00");
      if (selected < today) e.pickupDate = "Pickup date cannot be in the past";
    }

    if (!next.pickupTime.trim()) e.pickupTime = "Pickup time is required";

    // Backend serviceType validation
    if (next.serviceType !== "Driver Only" && next.serviceType !== "Car with Driver") {
      e.serviceType = "Service type is required";
    }

    // carType only required for Car with Driver
    if (next.serviceType === "Car with Driver" && !next.vehicleType) {
      e.vehicleType = "Car type is required for Car with Driver service";
    }

    // Backend estimatedHours / estimatedKm required depending on serviceType
    if (next.serviceType === "Driver Only") {
      if (!derived.estimatedHours || derived.estimatedHours < 1) {
        // Keep message generic; backend will validate too.
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
    value: BookingFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInlineErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }


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
      estimatedKm: derived.estimatedKm,
      paymentMethod: values.paymentMethod,
      notes: values.specialInstructions.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const res = await createBooking(payload);
        if (res?.success) {
          toast.success("Booking created successfully");
          setInlineErrors({});

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
        }
      } catch (err) {
        const backendErrors = parseBackendValidationErrors(err);
        if (backendErrors.length) {
          const mapped: Record<string, string> = {};
          backendErrors.forEach((be) => {
            if (be.field) mapped[be.field] = be.message;
          });
          // Map backend field names to our UI fields.
          // Backend fields: customerName, mobileNumber, pickupLocation, dropLocation, bookingDate, pickupTime,
          // serviceType, carType, estimatedHours, estimatedKm, paymentMethod, notes.
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

  return (
    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.customerName}
            onChange={(ev) => setField("customerName", ev.target.value)}
            placeholder="John Doe"
          />
          {inlineErrors.customerName ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.customerName}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.mobileNumber}
            onChange={(ev) => setField("mobileNumber", ev.target.value)}
            placeholder="6xxxxxxxxx"
            inputMode="numeric"
          />
          {inlineErrors.mobileNumber ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.mobileNumber}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email (optional)</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.email}
            onChange={(ev) => setField("email", ev.target.value)}
            placeholder="john@example.com"
            inputMode="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Service Type *</label>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.serviceType}
            onChange={(ev) =>
              setField("serviceType", ev.target.value as ServiceType)
            }
          >
            <option value="Driver Only">Driver Only</option>
            <option value="Car with Driver">Car with Driver</option>
          </select>
          {inlineErrors.serviceType ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.serviceType}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pickup Location *</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.pickupLocation}
            onChange={(ev) => setField("pickupLocation", ev.target.value)}
            placeholder="City, Address"
          />
          {inlineErrors.pickupLocation ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.pickupLocation}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Drop Location *</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.dropLocation}
            onChange={(ev) => setField("dropLocation", ev.target.value)}
            placeholder="City, Address"
          />
          {inlineErrors.dropLocation ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.dropLocation}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pickup Date *</label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.pickupDate}
            min={formatDateYYYYMMDD(today)}
            onChange={(ev) => setField("pickupDate", ev.target.value)}
          />
          {inlineErrors.pickupDate ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.pickupDate}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pickup Time *</label>
          <input
            type="time"
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.pickupTime}
            onChange={(ev) => setField("pickupTime", ev.target.value)}
          />
          {inlineErrors.pickupTime ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.pickupTime}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Type *</label>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.vehicleType}
            onChange={(ev) => setField("vehicleType", ev.target.value as CarType)}
            disabled={values.serviceType !== "Car with Driver"}
          >
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
          {inlineErrors.vehicleType ? (
            <p className="mt-1 text-sm text-red-600">{inlineErrors.vehicleType}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Number of Passengers
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.numberOfPassengers}
            onChange={(ev) =>
              setField("numberOfPassengers", Math.max(1, Number(ev.target.value) || 1))
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Special Instructions
          </label>
          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={values.specialInstructions}
            onChange={(ev) => setField("specialInstructions", ev.target.value)}
            placeholder="Anything we should know?"
            rows={4}
          />
        </div>
      </div>

      {submitError ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              Submitting...
            </span>
          ) : (
            "Book Now"
          )}
        </button>
      </div>
    </form>
  );
}

