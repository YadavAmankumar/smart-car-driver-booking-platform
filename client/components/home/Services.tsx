import { Headphones, Plane, Route, ShieldCheck, Timer } from "lucide-react";

type Service = {
  title:
    | "Driver Only"
    | "Car + Driver"
    | "Airport Transfer"
    | "Local Ride"
    | "Outstation";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const services: Service[] = [
  {
    title: "Driver Only",
    description: "Book a trained driver for your car and go hands-on your way.",
    icon: Timer,
  },
  {
    title: "Car + Driver",
    description: "A complete package with verified driver and a ready car.",
    icon: Route,
  },
  {
    title: "Airport Transfer",
    description: "Flight-aware pickups and smooth drop-offs to terminals.",
    icon: Plane,
  },
  {
    title: "Local Ride",
    description: "Quick local trips with transparent coordination.",
    icon: ShieldCheck,
  },
  {
    title: "Outstation",
    description: "Comfortable long drives with professional chauffeurs.",
    icon: Headphones,
  },
];

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Services</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Choose the ride that fits your plans
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          From driver-only convenience to airport and outstation comfort, pick
          what you need and book in minutes.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <article
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/5">
                  <Icon className="h-5 w-5 text-slate-900" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Professional dispatch
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

