import { Check, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";

type Plan = {
  name: string;
  priceLabel: string;
  description: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
  ctaHref: string;
};

const plans: Plan[] = [
  {
    name: "Driver Only",
    priceLabel: "From ₹199/hr",
    description: "Pick your date, we dispatch a verified driver for your own car.",
    badge: "Popular",
    features: [
      "Verified driver dispatch",
      "GPS-based pickup updates",
      "Flexible timing",
      "Reliable support",
    ],
    ctaHref: "/booking",
    highlight: true,
  },
  {
    name: "Car + Driver",
    priceLabel: "From ₹1,499/day",
    description: "A complete match with a ready car and professional chauffeur.",
    features: [
      "Car selection assistance",
      "Professional chauffeur",
      "On-time dispatch",
      "Transparent coordination",
    ],
    ctaHref: "/booking",
  },
  {
    name: "Airport Pickup",
    priceLabel: "From ₹2,499/trip",
    description: "Flight-aware scheduling for smooth arrival and departure transfers.",
    features: [
      "Terminal-aware pickup",
      "Tracking & ETA updates",
      "Clean, comfortable vehicles",
      "Priority dispatch",
    ],
    ctaHref: "/booking",
  },
  {
    name: "Outstation",
    priceLabel: "From ₹5,999/trip",
    description: "Premium long-drive experience with dependable chauffeurs.",
    features: [
      "Comfort-first driving",
      "Route coordination",
      "Professional support",
      "Secure journey",
    ],
    ctaHref: "/booking",
  },
  {
    name: "Corporate",
    priceLabel: "Custom pricing",
    description: "For teams and business travelers—scheduling that stays on track.",
    features: [
      "Dedicated dispatch",
      "Group-friendly coordination",
      "Priority support",
      "Invoice support-ready",
    ],
    ctaHref: "/booking",
  },
];

export default function PricingPlans() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" id="pricing">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Pricing</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Plans built for every trip
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Transparent options that keep your booking simple.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.highlight ? Timer : ShieldCheck;
          return (
            <article
              key={plan.name}
              className={
                plan.highlight
                  ? "relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-sm"
                  : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              }
            >
              {plan.badge ? (
                <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  {plan.badge}
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/5">
                  <Icon className="h-5 w-5 text-slate-900" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {plan.priceLabel}
                </p>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href={plan.ctaHref}
                  className={
                    plan.highlight
                      ? "inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      : "inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  }
                >
                  Book Now
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

