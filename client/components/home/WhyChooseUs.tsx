import { BadgeCheck, ShieldCheck, Headphones, MapPin, Star, Users } from "lucide-react";

type WhyCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const cards: WhyCard[] = [
  {
    title: "Verified Drivers",
    description: "Background-checked professionals for a dependable ride.",
    icon: BadgeCheck,
  },
  {
    title: "GPS Tracking",
    description: "Real-time visibility for pickup, route, and updates.",
    icon: MapPin,
  },
  {
    title: "24x7 Support",
    description: "We’re here whenever you need help—day or night.",
    icon: Headphones,
  },
  {
    title: "Safe Journey",
    description: "Safety-first processes for every trip.",
    icon: ShieldCheck,
  },
  {
    title: "Affordable Pricing",
    description: "Transparent pricing built for every travel need.",
    icon: Star,
  },
  {
    title: "Professional Chauffeurs",
    description: "Polished, courteous drivers that respect your time.",
    icon: Users,
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" id="why-choose-us">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Why choose us</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Premium comfort, built for real travel
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          SmartDrive brings verified drivers, transparent planning, and a smooth
          experience—so you can book confidently.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/5 transition group-hover:bg-slate-900/10">
                  <Icon className="h-5 w-5 text-slate-900" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-70" />

              <p className="mt-4 text-xs font-semibold text-slate-700">
                Premium support experience
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

