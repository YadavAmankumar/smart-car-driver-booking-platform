import { CarFront, Sparkles, Truck } from "lucide-react";

type FleetItem = {
  title: "Sedan" | "SUV" | "Luxury" | "Tempo Traveller";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const fleet: FleetItem[] = [
  {
    title: "Sedan",
    description: "Smooth city comfort for daily rides.",
    icon: CarFront,
  },
  {
    title: "SUV",
    description: "More space and confidence on the road.",
    icon: Truck,
  },
  {
    title: "Luxury",
    description: "Premium experience with refined interiors.",
    icon: Sparkles,
  },
  {
    title: "Tempo Traveller",
    description: "Group-friendly travel for events and tours.",
    icon: Truck,
  },
];

export default function Fleet() {
  return (
    <section id="fleet" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Fleet</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Vehicles for every kind of trip
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Pick a category, then book your date—our dispatch assigns the best
          available match.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {fleet.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/5">
                  <Icon className="h-5 w-5 text-slate-900" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                Availability updates in real time
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

