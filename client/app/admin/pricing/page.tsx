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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
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
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor={fieldKey}>
        {field.label}
      </label>
      <Input
        id={fieldKey}
        value={form[fieldKey]}
        disabled={disabled}
        min={field.positive ? "0.01" : "0"}
        step="any"
        type="number"
        onChange={(event) => onChange(fieldKey, event.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
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
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-lg font-bold text-slate-900">Admin Pricing</h1><p className="mt-1 text-sm text-slate-600">Manage the active pricing configuration.</p></div>
          <div className="flex gap-3"><Button type="button" variant="secondary" disabled={!form || disabled} onClick={reset}>Reset</Button><Button type="button" variant="primary" disabled={!form || disabled} onClick={() => void save()}>{saving ? <span className="inline-flex items-center gap-2"><LoadingSpinner />Saving…</span> : "Save Changes"}</Button></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <div className="flex items-center gap-3 text-slate-600"><LoadingSpinner />Loading pricing…</div> : error ? <EmptyState title="Unable to load pricing" description={error} /> : !form ? <EmptyState title="Pricing not found" description="An active pricing configuration is required." /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="🚗 Driver Only">{group(["driverBaseFare", "driverHourlyRate", "driverExtraHourlyRate", "driverMinimumHours"])}</Section>
            <Section title="🚙 Car With Driver">{group(["acRatePerKm", "nonAcRatePerKm", "minimumKm", "extraKmCharge"])}</Section>
            <Section title="🌍 Outstation">{group(["driverAllowance", "nightStay", "tollCharge", "stateTax"])}</Section>
            <Section title="📍 Local">{group(["localBaseFare", "localPerKmRate", "weekendChargePercent"])}</Section>
            <Section title="🌙 Common Charges">{group(["waitingChargePerMinute", "waitingGraceTimeMinutes", "airportCharge", "gstPercent", "nightChargePercent", "minimumFare"])}</Section>
          </div>}
        </div>
      </section>
    </main>
  );
}
