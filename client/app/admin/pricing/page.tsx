"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { type AxiosError } from "axios";

import { Button, EmptyState, Input, LoadingSpinner } from "@/components/ui/primitives";
import {
  getAdminPricing,
  getAxiosErrorMessage,
  getCustomerProfile,
  updateAdminPricing,
  type AdminPricingResponse,
  type AdminPricingUpdatePayload,
} from "@/lib/api";

type Pricing = NonNullable<AdminPricingResponse["data"]>;
type PricingForm = Record<keyof AdminPricingUpdatePayload, string>;
type FormErrors = Partial<Record<keyof PricingForm, string>>;

const fields: Array<{
  key: keyof PricingForm;
  label: string;
  positive?: boolean;
}> = [
  { key: "driverBaseFare", label: "Base Fare" },
  { key: "driverHourlyRate", label: "Hourly Rate" },
  { key: "driverExtraHourlyRate", label: "Extra Hourly Rate" },
  { key: "driverMinimumHours", label: "Minimum Hours", positive: true },
  { key: "acRatePerKm", label: "AC Rate Per KM" },
  { key: "nonAcRatePerKm", label: "Non AC Rate Per KM" },
  { key: "minimumKm", label: "Minimum KM", positive: true },
  { key: "extraKmCharge", label: "Extra KM Charge" },
  { key: "driverAllowance", label: "Driver Allowance" },
  { key: "nightStay", label: "Night Stay" },
  { key: "tollCharge", label: "Toll" },
  { key: "stateTax", label: "State Tax" },
  { key: "localBaseFare", label: "Base Fare" },
  { key: "localPerKmRate", label: "Per KM Rate" },
  { key: "waitingChargePerMinute", label: "Waiting Charge Per Minute" },
  { key: "waitingGraceTimeMinutes", label: "Waiting Grace Time (Minutes)" },
  { key: "airportCharge", label: "Airport Charge" },
  { key: "gstPercent", label: "GST (%)" },
  { key: "nightChargePercent", label: "Night Charge (%)" },
  { key: "weekendChargePercent", label: "Weekend Charge (%)" },
  { key: "minimumFare", label: "Minimum Fare" },
];

const fieldByKey = Object.fromEntries(fields.map((field) => [field.key, field]));

function buildForm(pricing: Pricing): PricingForm {
  return Object.fromEntries(
    fields.map(({ key }) => [key, String(pricing[key] ?? 0)]),
  ) as PricingForm;
}

function validate(form: PricingForm): FormErrors {
  const errors: FormErrors = {};
  for (const field of fields) {
    const rawValue = form[field.key].trim();
    const value = Number(rawValue);
    if (!rawValue) {
      errors[field.key] = `${field.label} is required.`;
    } else if (!Number.isFinite(value) || (field.positive ? value <= 0 : value < 0)) {
      errors[field.key] = field.positive
        ? `${field.label} must be a positive number.`
        : `${field.label} cannot be negative.`;
    }
  }
  return errors;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Field({
  fieldKey,
  form,
  errors,
  disabled,
  onChange,
}: {
  fieldKey: keyof PricingForm;
  form: PricingForm;
  errors: FormErrors;
  disabled: boolean;
  onChange: (key: keyof PricingForm, value: string) => void;
}) {
  const field = fieldByKey[fieldKey];
  const error = errors[fieldKey];

  const percentageFields = [
    "gstPercent",
    "nightChargePercent",
    "weekendChargePercent",
  ];

  const hourFields = [
    "driverMinimumHours",
    "waitingGraceTimeMinutes",
  ];

  const distanceFields = ["minimumKm"];

  const suffix = percentageFields.includes(fieldKey)
    ? "%"
    : hourFields.includes(fieldKey)
      ? fieldKey === "waitingGraceTimeMinutes"
        ? "min"
        : "hrs"
      : distanceFields.includes(fieldKey)
        ? "km"
        : "₹";

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          className="text-xs font-semibold text-slate-700"
          htmlFor={fieldKey}
        >
          {field.label}
        </label>

        <span className="shrink-0 text-[11px] font-medium text-slate-400">
          {suffix}
        </span>
      </div>

      <Input
        id={fieldKey}
        value={form[fieldKey]}
        disabled={disabled}
        min={field.positive ? "0.01" : "0"}
        step="any"
        type="number"
        className="h-11 rounded-lg border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        onChange={(event) => onChange(fieldKey, event.target.value)}
      />

      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export default function AdminPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPricing, setSavedPricing] = useState<Pricing | null>(null);
  const [form, setForm] = useState<PricingForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const loadPricing = async () => {
    const response = await getAdminPricing();
    if (!response.data) throw new Error("Pricing not found in backend.");
    console.log("[pricing] GET /pricing refreshed data", response.data);
    setSavedPricing(response.data);
    setForm(buildForm(response.data));
    setErrors({});
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await getCustomerProfile();
        if (!mounted) return;
        if (profile.user.role !== "admin") {
          toast.error("Access denied");
          window.location.href = profile.user.role === "driver" ? "/driver/dashboard" : "/dashboard";
          return;
        }
        await loadPricing();
      } catch (caught) {
        if (!mounted) return;
        const message = getAxiosErrorMessage(caught as AxiosError);
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const disabled = loading || saving;
  const updateField = (key: keyof PricingForm, value: string) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const reset = () => {
    if (!savedPricing) return;
    setForm(buildForm(savedPricing));
    setErrors({});
  };

  const save = async () => {
    if (!form) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Please correct the highlighted pricing fields.");
      return;
    }

    const payload = Object.fromEntries(
      fields.map(({ key }) => [key, Number(form[key])]),
    ) as AdminPricingUpdatePayload;

    console.log("[pricing] Save Changes form payload", payload);
    setSaving(true);
    try {
      const response = await updateAdminPricing(payload);
      console.log("[pricing] Save Changes API response", response);
      await loadPricing();
      toast.success("Pricing updated successfully.");
    } catch {
      toast.error("Failed to update pricing.");
    } finally {
      setSaving(false);
    }
  };

  const group = (keys: Array<keyof PricingForm>) =>
    form ? keys.map((key) => <Field key={key} fieldKey={key} form={form} errors={errors} disabled={disabled} onChange={updateField} />) : null;

  return (
    <main className="w-full px-6 py-6">
      <section className="space-y-6">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Pricing
              </h1>
            </div>

            <p className="mt-1.5 max-w-xl text-sm text-slate-500">
              Configure the rates and charges used across SmartDrive bookings.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="h-10 flex-1 rounded-lg px-4 text-sm sm:flex-none"
              disabled={!form || disabled}
              onClick={reset}
            >
              Reset
            </Button>

            <Button
              type="button"
              variant="primary"
              className="h-10 flex-1 rounded-lg px-5 text-sm sm:flex-none"
              disabled={!form || disabled}
              onClick={() => void save()}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <div className="flex items-center gap-3 text-slate-600"><LoadingSpinner />Loading pricing…</div> : error ? <EmptyState title="Unable to load pricing" description={error} /> : !form ? <EmptyState title="Pricing not found" description="An active pricing configuration is required." /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Driver Only" description="Hourly pricing when the customer uses their own car.">{group(["driverBaseFare", "driverHourlyRate", "driverExtraHourlyRate", "driverMinimumHours"])}</Section>
            <Section title="Car With Driver" description="Distance-based pricing for SmartDrive vehicles.">{group(["acRatePerKm", "nonAcRatePerKm", "minimumKm", "extraKmCharge"])}</Section>
            <Section title="Outstation" description="Additional charges applied to outstation trips.">{group(["driverAllowance", "nightStay", "tollCharge", "stateTax"])}</Section>
            <Section title="Local" description="Pricing rules for local city bookings.">{group(["localBaseFare", "localPerKmRate", "weekendChargePercent"])}</Section>
            <Section title="Common Charges" description="Additional charges that can apply across booking types.">{group(["waitingChargePerMinute", "waitingGraceTimeMinutes", "airportCharge", "gstPercent", "nightChargePercent", "minimumFare"])}</Section>
          </div>}
        </div>
      </section>
    </main>
  );
}
