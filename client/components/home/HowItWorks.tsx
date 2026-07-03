import { CalendarCheck, Hand, IdCard, Route } from "lucide-react";

type Step = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const steps: Step[] = [
  {
    title: "Choose Service",
    description: "Pick driver-only, car + driver, airport, local, or outstation.",
    icon: Route,
  },
  {
    title: "Select Date",
    description: "Choose your travel date and get a smooth dispatch plan.",
    icon: CalendarCheck,
  },
  {
    title: "Driver Assigned",
    description: "A professional, verified driver is assigned for your trip.",
    icon: IdCard,
  },
  {
    title: "Trip Starts",
    description: "Relax—your ride begins with coordinated pickup.",
    icon: Hand,
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">How it works</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Simple steps to your next ride
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          No complex flows—just choose, schedule, and go.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <article
              key={step.title}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="absolute right-3 top-3 text-5xl font-extrabold text-slate-100">
                {idx + 1}
              </div>
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/5">
                  <Icon className="h-5 w-5 text-slate-900" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

