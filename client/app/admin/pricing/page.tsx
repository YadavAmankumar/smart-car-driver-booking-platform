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
  type VehicleCategoryPricing,
  type VehiclePricing,
} from "@/lib/api";

type Pricing = NonNullable<AdminPricingResponse["data"]>;

type VehiclePricingForm = {
  baseFare: string;
  ratePerKm: string;
  minimumKm: string;
  extraKmCharge: string;
};

type VehicleCategoryForm = {
  ac: VehiclePricingForm;
  nonAc: VehiclePricingForm;
};

type VehicleGroupForm = {
  mini: VehicleCategoryForm;
  sedan: VehicleCategoryForm;
  xl7Seater: VehicleCategoryForm;
  forceTraveller: VehicleCategoryForm;
};

type PricingForm = {
  driverOnly: {
    baseFare: string;
    hourlyRate: string;
    extraHourlyRate: string;
    minimumHours: string;
  };
  carWithDriver: {
    local: VehicleGroupForm;
    outstation: VehicleGroupForm;
  };
  outstationCharges: {
    driverAllowance: string;
    nightStay: string;
  };
  common: {
    waitingChargePerMinute: string;
    waitingGraceTimeMinutes: string;
    gstPercent: string;
    nightChargePercent: string;
    weekendChargePercent: string;
    minimumFare: string;
    nightStartHour: string;
    nightEndHour: string;
  };
};

type FormErrors = Record<string, string | undefined>;

const vehicleCategories = [
  { key: "mini", label: "Mini" },
  { key: "sedan", label: "Sedan" },
  { key: "xl7Seater", label: "XL – 7 Seater" },
  { key: "forceTraveller", label: "Force Traveller" },
] as const;

const vehicleTypes = ["ac", "nonAc"] as const;

const emptyVehiclePricing = (): VehiclePricingForm => ({
  baseFare: "0",
  ratePerKm: "0",
  minimumKm: "1",
  extraKmCharge: "0",
});

const emptyVehicleCategory = (): VehicleCategoryForm => ({
  ac: emptyVehiclePricing(),
  nonAc: emptyVehiclePricing(),
});

const emptyVehicleGroup = (): VehicleGroupForm => ({
  mini: emptyVehicleCategory(),
  sedan: emptyVehicleCategory(),
  xl7Seater: emptyVehicleCategory(),
  forceTraveller: emptyVehicleCategory(),
});

function numberString(value: number | undefined, fallback = 0) {
  return String(value ?? fallback);
}

function buildVehiclePricingForm(
  pricing: VehiclePricing | undefined,
): VehiclePricingForm {
  return {
    baseFare: numberString(pricing?.baseFare),
    ratePerKm: numberString(pricing?.ratePerKm),
    minimumKm: numberString(pricing?.minimumKm, 1),
    extraKmCharge: numberString(pricing?.extraKmCharge),
  };
}

function buildVehicleCategoryForm(
  pricing: VehicleCategoryPricing | undefined,
): VehicleCategoryForm {
  return {
    ac: buildVehiclePricingForm(pricing?.ac),
    nonAc: buildVehiclePricingForm(pricing?.nonAc),
  };
}

function buildVehicleGroupForm(
  group:
    | NonNullable<Pricing["carWithDriver"]>["local"]
    | NonNullable<Pricing["carWithDriver"]>["outstation"]
    | undefined,
): VehicleGroupForm {
  const source = group as Record<string, VehicleCategoryPricing | undefined> | undefined;

  return {
    mini: buildVehicleCategoryForm(source?.mini),
    sedan: buildVehicleCategoryForm(source?.sedan),
    xl7Seater: buildVehicleCategoryForm(source?.xl7Seater),
    forceTraveller: buildVehicleCategoryForm(source?.forceTraveller),
  };
}

function buildForm(pricing: Pricing): PricingForm {
  return {
    driverOnly: {
      baseFare: numberString(pricing.driverOnly?.baseFare),
      hourlyRate: numberString(pricing.driverOnly?.hourlyRate),
      extraHourlyRate: numberString(pricing.driverOnly?.extraHourlyRate),
      minimumHours: numberString(pricing.driverOnly?.minimumHours, 1),
    },
    carWithDriver: {
      local: buildVehicleGroupForm(pricing.carWithDriver?.local),
      outstation: buildVehicleGroupForm(pricing.carWithDriver?.outstation),
    },
    outstationCharges: {
      driverAllowance: numberString(pricing.outstationCharges?.driverAllowance),
      nightStay: numberString(pricing.outstationCharges?.nightStay),
    },
    common: {
      waitingChargePerMinute: numberString(
        pricing.common?.waitingChargePerMinute,
      ),
      waitingGraceTimeMinutes: numberString(
        pricing.common?.waitingGraceTimeMinutes,
      ),
      gstPercent: numberString(pricing.common?.gstPercent),
      nightChargePercent: numberString(pricing.common?.nightChargePercent),
      weekendChargePercent: numberString(pricing.common?.weekendChargePercent),
      minimumFare: numberString(pricing.common?.minimumFare),
      nightStartHour: numberString(
        pricing.common?.nightChargeWindow?.startHour,
      ),
      nightEndHour: numberString(
        pricing.common?.nightChargeWindow?.endHour,
      ),
    },
  };
}

function vehiclePricingPayload(
  form: VehiclePricingForm,
): VehiclePricing {
  return {
    baseFare: Number(form.baseFare),
    ratePerKm: Number(form.ratePerKm),
    minimumKm: Number(form.minimumKm),
    extraKmCharge: Number(form.extraKmCharge),
  };
}

function vehicleCategoryPayload(
  form: VehicleCategoryForm,
): VehicleCategoryPricing {
  return {
    ac: vehiclePricingPayload(form.ac),
    nonAc: vehiclePricingPayload(form.nonAc),
  };
}

function vehicleGroupPayload(
  form: VehicleGroupForm,
): Record<string, VehicleCategoryPricing> {
  return {
    mini: vehicleCategoryPayload(form.mini),
    sedan: vehicleCategoryPayload(form.sedan),
    xl7Seater: vehicleCategoryPayload(form.xl7Seater),
    forceTraveller: vehicleCategoryPayload(form.forceTraveller),
  };
}

function buildPayload(form: PricingForm): AdminPricingUpdatePayload {
  return {
    driverOnly: {
      baseFare: Number(form.driverOnly.baseFare),
      hourlyRate: Number(form.driverOnly.hourlyRate),
      extraHourlyRate: Number(form.driverOnly.extraHourlyRate),
      minimumHours: Number(form.driverOnly.minimumHours),
    },
    carWithDriver: {
      local: vehicleGroupPayload(form.carWithDriver.local),
      outstation: vehicleGroupPayload(form.carWithDriver.outstation),
    },
    outstationCharges: {
      driverAllowance: Number(form.outstationCharges.driverAllowance),
      nightStay: Number(form.outstationCharges.nightStay),
    },
    common: {
      waitingChargePerMinute: Number(form.common.waitingChargePerMinute),
      waitingGraceTimeMinutes: Number(
        form.common.waitingGraceTimeMinutes,
      ),
      gstPercent: Number(form.common.gstPercent),
      nightChargePercent: Number(form.common.nightChargePercent),
      weekendChargePercent: Number(form.common.weekendChargePercent),
      minimumFare: Number(form.common.minimumFare),
      nightChargeWindow: {
        startHour: Number(form.common.nightStartHour),
        endHour: Number(form.common.nightEndHour),
      },
    },
  };
}

function setError(
  errors: FormErrors,
  path: string,
  message: string,
) {
  errors[path] = message;
}

function validateVehiclePricing(
  form: VehiclePricingForm,
  path: string,
  errors: FormErrors,
) {
  const fields = [
    ["baseFare", "Base Fare", false],
    ["ratePerKm", "Rate Per KM", false],
    ["minimumKm", "Minimum KM", true],
    ["extraKmCharge", "Extra KM Charge", false],
  ] as const;

  for (const [key, label, positive] of fields) {
    const raw = form[key].trim();
    const value = Number(raw);

    if (!raw) {
      setError(errors, `${path}.${key}`, `${label} is required.`);
    } else if (
      !Number.isFinite(value) ||
      (positive ? value <= 0 : value < 0)
    ) {
      setError(
        errors,
        `${path}.${key}`,
        positive
          ? `${label} must be a positive number.`
          : `${label} cannot be negative.`,
      );
    }
  }
}

function validateVehicleGroup(
  form: VehicleGroupForm,
  path: string,
  errors: FormErrors,
) {
  for (const category of vehicleCategories) {
    for (const type of vehicleTypes) {
      validateVehiclePricing(
        form[category.key][type],
        `${path}.${category.key}.${type}`,
        errors,
      );
    }
  }
}

function validate(form: PricingForm): FormErrors {
  const errors: FormErrors = {};

  const driverFields = [
    ["baseFare", "Base Fare", false],
    ["hourlyRate", "Hourly Rate", false],
    ["extraHourlyRate", "Extra Hourly Rate", false],
    ["minimumHours", "Minimum Hours", true],
  ] as const;

  for (const [key, label, positive] of driverFields) {
    const raw = form.driverOnly[key].trim();
    const value = Number(raw);

    if (!raw) {
      setError(errors, `driverOnly.${key}`, `${label} is required.`);
    } else if (
      !Number.isFinite(value) ||
      (positive ? value <= 0 : value < 0)
    ) {
      setError(
        errors,
        `driverOnly.${key}`,
        positive
          ? `${label} must be a positive number.`
          : `${label} cannot be negative.`,
      );
    }
  }

  validateVehicleGroup(form.carWithDriver.local, "local", errors);
  validateVehicleGroup(form.carWithDriver.outstation, "outstation", errors);

  const chargeFields = [
    ["driverAllowance", "Driver Allowance"],
    ["nightStay", "Night Stay"],
  ] as const;

  for (const [key, label] of chargeFields) {
    const raw = form.outstationCharges[key].trim();
    const value = Number(raw);

    if (!raw) {
      setError(errors, `outstationCharges.${key}`, `${label} is required.`);
    } else if (!Number.isFinite(value) || value < 0) {
      setError(
        errors,
        `outstationCharges.${key}`,
        `${label} cannot be negative.`,
      );
    }
  }

  const commonFields = [
    ["waitingChargePerMinute", "Waiting Charge Per Minute"],
    ["waitingGraceTimeMinutes", "Waiting Grace Time"],
    ["gstPercent", "GST"],
    ["nightChargePercent", "Night Charge"],
    ["weekendChargePercent", "Weekend Charge"],
    ["minimumFare", "Minimum Fare"],
  ] as const;

  for (const [key, label] of commonFields) {
    const raw = form.common[key].trim();
    const value = Number(raw);

    if (!raw) {
      setError(errors, `common.${key}`, `${label} is required.`);
    } else if (!Number.isFinite(value) || value < 0) {
      setError(
        errors,
        `common.${key}`,
        `${label} cannot be negative.`,
      );
    }
  }

  for (const [key, label] of [
    ["nightStartHour", "Night Start Hour"],
    ["nightEndHour", "Night End Hour"],
  ] as const) {
    const raw = form.common[key].trim();
    const value = Number(raw);

    if (!raw) {
      setError(errors, `common.${key}`, `${label} is required.`);
    } else if (!Number.isInteger(value) || value < 0 || value > 23) {
      setError(
        errors,
        `common.${key}`,
        `${label} must be an integer from 0 to 23.`,
      );
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
    <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TimeField({
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const hour24 = Number(value);
  const validHour = Number.isInteger(hour24) && hour24 >= 0 && hour24 <= 23;
  const hour12 = validHour ? hour24 % 12 || 12 : 12;
  const period = validHour && hour24 >= 12 ? "PM" : "AM";

  const handleHourChange = (nextHour: string) => {
    const hour = Number(nextHour);
    if (!Number.isInteger(hour) || hour < 1 || hour > 12) return;

    const converted =
      period === "PM"
        ? (hour === 12 ? 12 : hour + 12)
        : (hour === 12 ? 0 : hour);

    onChange(String(converted));
  };

  const handlePeriodChange = (nextPeriod: "AM" | "PM") => {
    const converted =
      nextPeriod === "PM"
        ? (hour12 === 12 ? 12 : hour12 + 12)
        : (hour12 === 12 ? 0 : hour12);

    onChange(String(converted));
  };

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>

      <div className="flex gap-2">
        <select
          value={hour12}
          disabled={disabled}
          onChange={(event) => handleHourChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>

        <select
          value={period}
          disabled={disabled}
          onChange={(event) =>
            handlePeriodChange(event.target.value as "AM" | "PM")
          }
          className="h-10 w-24 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : null}
    </label>
  );
}

function NumberField({
  label,
  value,
  error,
  suffix,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  suffix?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>

      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={suffix ? "pr-12" : undefined}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : null}
    </label>
  );
}

function VehiclePricingCard({
  label,
  form,
  errors,
  disabled,
  path,
  onChange,
}: {
  label: string;
  form: VehicleCategoryForm;
  errors: FormErrors;
  disabled: boolean;
  path: string;
  onChange: (
    type: "ac" | "nonAc",
    key: keyof VehiclePricingForm,
    value: string,
  ) => void;
}) {
  const renderType = (type: "ac" | "nonAc", title: string) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-4 text-sm font-semibold text-slate-800">{title}</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Base Fare"
          value={form[type].baseFare}
          error={errors[`${path}.${type}.baseFare`]}
          suffix="₹"
          disabled={disabled}
          onChange={(value) => onChange(type, "baseFare", value)}
        />

        <NumberField
          label="Rate Per KM"
          value={form[type].ratePerKm}
          error={errors[`${path}.${type}.ratePerKm`]}
          suffix="₹"
          disabled={disabled}
          onChange={(value) => onChange(type, "ratePerKm", value)}
        />

        <NumberField
          label="Minimum KM"
          value={form[type].minimumKm}
          error={errors[`${path}.${type}.minimumKm`]}
          suffix="km"
          disabled={disabled}
          onChange={(value) => onChange(type, "minimumKm", value)}
        />

        <NumberField
          label="Extra KM Charge"
          value={form[type].extraKmCharge}
          error={errors[`${path}.${type}.extraKmCharge`]}
          suffix="₹"
          disabled={disabled}
          onChange={(value) => onChange(type, "extraKmCharge", value)}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <div className="grid gap-4 xl:grid-cols-2">
        {renderType("ac", "AC")}
        {renderType("nonAc", "Non-AC")}
      </div>
    </div>
  );
}

function VehicleGroupSection({
  title,
  description,
  form,
  errors,
  disabled,
  path,
  onChange,
}: {
  title: string;
  description: string;
  form: VehicleGroupForm;
  errors: FormErrors;
  disabled: boolean;
  path: string;
  onChange: (
    category: keyof VehicleGroupForm,
    type: "ac" | "nonAc",
    key: keyof VehiclePricingForm,
    value: string,
  ) => void;
}) {
  return (
    <Section title={title} description={description}>
      <div className="space-y-5">
        {vehicleCategories.map((category) => (
          <VehiclePricingCard
            key={category.key}
            label={category.label}
            form={form[category.key]}
            errors={errors}
            disabled={disabled}
            path={`${path}.${category.key}`}
            onChange={(type, key, value) =>
              onChange(category.key, type, key, value)
            }
          />
        ))}
      </div>
    </Section>
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

    if (!response.data) {
      throw new Error("Pricing not found in backend.");
    }

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
          window.location.href =
            profile.user.role === "driver" ? "/driver/dashboard" : "/dashboard";
          return;
        }

        await loadPricing();
      } catch (caught) {
        if (!mounted) return;

        const message = getAxiosErrorMessage(caught as AxiosError);
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const disabled = loading || saving;

  const updateDriverField = (
    key: keyof PricingForm["driverOnly"],
    value: string,
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            driverOnly: {
              ...current.driverOnly,
              [key]: value,
            },
          }
        : current,
    );

    setErrors((current) => ({
      ...current,
      [`driverOnly.${key}`]: undefined,
    }));
  };

  const updateVehicleField = (
    tripType: "local" | "outstation",
    category: keyof VehicleGroupForm,
    type: "ac" | "nonAc",
    key: keyof VehiclePricingForm,
    value: string,
  ) => {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        carWithDriver: {
          ...current.carWithDriver,
          [tripType]: {
            ...current.carWithDriver[tripType],
            [category]: {
              ...current.carWithDriver[tripType][category],
              [type]: {
                ...current.carWithDriver[tripType][category][type],
                [key]: value,
              },
            },
          },
        },
      };
    });

    setErrors((current) => ({
      ...current,
      [`${tripType}.${category}.${type}.${key}`]: undefined,
    }));
  };

  const updateChargeField = (
    key: keyof PricingForm["outstationCharges"],
    value: string,
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            outstationCharges: {
              ...current.outstationCharges,
              [key]: value,
            },
          }
        : current,
    );

    setErrors((current) => ({
      ...current,
      [`outstationCharges.${key}`]: undefined,
    }));
  };

  const updateCommonField = (
    key: keyof PricingForm["common"],
    value: string,
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            common: {
              ...current.common,
              [key]: value,
            },
          }
        : current,
    );

    setErrors((current) => ({
      ...current,
      [`common.${key}`]: undefined,
    }));
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

    const payload = buildPayload(form);

    console.log("[pricing] Save Changes form payload", payload);

    setSaving(true);

    try {
      const response = await updateAdminPricing(payload);

      console.log("[pricing] Save Changes API response", response);

      await loadPricing();
      toast.success("Pricing updated successfully.");
    } catch (caught) {
      const message = getAxiosErrorMessage(caught as AxiosError);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="w-full px-6 py-6">
      <section className="space-y-6">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Pricing
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Configure vehicle-specific rates and charges used across SmartDrive bookings.
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
          {loading ? (
            <div className="flex items-center gap-3 text-slate-600">
              <LoadingSpinner />
              Loading pricing…
            </div>
          ) : error ? (
            <EmptyState
              title="Unable to load pricing"
              description={error}
            />
          ) : !form ? (
            <EmptyState
              title="Pricing not found"
              description="An active pricing configuration is required."
            />
          ) : (
            <div className="space-y-6">
              <Section
                title="Driver Only"
                description="Hourly pricing when the customer uses their own car."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <NumberField
                    label="Base Fare"
                    value={form.driverOnly.baseFare}
                    error={errors["driverOnly.baseFare"]}
                    suffix="₹"
                    disabled={disabled}
                    onChange={(value) =>
                      updateDriverField("baseFare", value)
                    }
                  />

                  <NumberField
                    label="Hourly Rate"
                    value={form.driverOnly.hourlyRate}
                    error={errors["driverOnly.hourlyRate"]}
                    suffix="₹/hr"
                    disabled={disabled}
                    onChange={(value) =>
                      updateDriverField("hourlyRate", value)
                    }
                  />

                  <NumberField
                    label="Extra Hourly Rate"
                    value={form.driverOnly.extraHourlyRate}
                    error={errors["driverOnly.extraHourlyRate"]}
                    suffix="₹/hr"
                    disabled={disabled}
                    onChange={(value) =>
                      updateDriverField("extraHourlyRate", value)
                    }
                  />

                  <NumberField
                    label="Minimum Hours"
                    value={form.driverOnly.minimumHours}
                    error={errors["driverOnly.minimumHours"]}
                    suffix="hrs"
                    disabled={disabled}
                    onChange={(value) =>
                      updateDriverField("minimumHours", value)
                    }
                  />
                </div>
              </Section>

              <VehicleGroupSection
                title="Car + Driver — Local"
                description="Local city pricing by vehicle category and AC type."
                form={form.carWithDriver.local}
                errors={errors}
                disabled={disabled}
                path="local"
                onChange={(category, type, key, value) =>
                  updateVehicleField(
                    "local",
                    category,
                    type,
                    key,
                    value,
                  )
                }
              />

              <VehicleGroupSection
                title="Car + Driver — Outstation"
                description="Outstation distance pricing by vehicle category and AC type."
                form={form.carWithDriver.outstation}
                errors={errors}
                disabled={disabled}
                path="outstation"
                onChange={(category, type, key, value) =>
                  updateVehicleField(
                    "outstation",
                    category,
                    type,
                    key,
                    value,
                  )
                }
              />

              <Section
                title="Outstation Charges"
                description="Additional charges applied to outstation trips."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    label="Driver Allowance"
                    value={form.outstationCharges.driverAllowance}
                    error={errors["outstationCharges.driverAllowance"]}
                    suffix="₹"
                    disabled={disabled}
                    onChange={(value) =>
                      updateChargeField("driverAllowance", value)
                    }
                  />

                  <NumberField
                    label="Night Stay"
                    value={form.outstationCharges.nightStay}
                    error={errors["outstationCharges.nightStay"]}
                    suffix="₹"
                    disabled={disabled}
                    onChange={(value) =>
                      updateChargeField("nightStay", value)
                    }
                  />
                </div>
              </Section>

              <Section
                title="Common Charges"
                description="Shared pricing rules applied across supported booking calculations."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <NumberField
                    label="Waiting Charge Per Minute"
                    value={form.common.waitingChargePerMinute}
                    error={errors["common.waitingChargePerMinute"]}
                    suffix="₹"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("waitingChargePerMinute", value)
                    }
                  />

                  <NumberField
                    label="Waiting Grace Time"
                    value={form.common.waitingGraceTimeMinutes}
                    error={errors["common.waitingGraceTimeMinutes"]}
                    suffix="min"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("waitingGraceTimeMinutes", value)
                    }
                  />

                  <NumberField
                    label="GST"
                    value={form.common.gstPercent}
                    error={errors["common.gstPercent"]}
                    suffix="%"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("gstPercent", value)
                    }
                  />

                  <NumberField
                    label="Night Charge"
                    value={form.common.nightChargePercent}
                    error={errors["common.nightChargePercent"]}
                    suffix="%"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("nightChargePercent", value)
                    }
                  />

                  <NumberField
                    label="Weekend Charge"
                    value={form.common.weekendChargePercent}
                    error={errors["common.weekendChargePercent"]}
                    suffix="%"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("weekendChargePercent", value)
                    }
                  />

                  <NumberField
                    label="Minimum Fare"
                    value={form.common.minimumFare}
                    error={errors["common.minimumFare"]}
                    suffix="₹"
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("minimumFare", value)
                    }
                  />

                  <TimeField
                    label="Night Start Time"
                    value={form.common.nightStartHour}
                    error={errors["common.nightStartHour"]}
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("nightStartHour", value)
                    }
                  />

                  <TimeField
                    label="Night End Time"
                    value={form.common.nightEndHour}
                    error={errors["common.nightEndHour"]}
                    disabled={disabled}
                    onChange={(value) =>
                      updateCommonField("nightEndHour", value)
                    }
                  />

                  <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Night timing
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use 12-hour format (AM/PM) · Example{" "}
                      <strong>10:00 PM – 6:00 AM</strong>
                      <br />
                      Configure the night window according to your business hours.
                    </p>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
