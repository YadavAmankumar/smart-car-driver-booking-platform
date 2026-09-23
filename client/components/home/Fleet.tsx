import { CarFront, Route, ShieldCheck, Users } from "lucide-react";

type CarOption = {
  title: "Comfort Cars" | "Spacious SUVs" | "Premium Cars" | "Group Travel";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const carOptions: CarOption[] = [
  {
    title: "Comfort Cars",
    description: "Comfortable cars for everyday city travel.",
    icon: CarFront,
  },
  {
    title: "Spacious SUVs",
    description: "Extra space for family and longer journeys.",
    icon: Users,
  },
  {
    title: "Premium Cars",
    description: "Refined cars for comfortable and special trips.",
    icon: ShieldCheck,
  },
  {
    title: "Group Travel",
    description: "Larger options for group journeys and tours.",
    icon: Route,
  },
];

export default function Fleet() {
  return (
    <section id="fleet" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Car</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Choose a car that fits your trip
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Choose the type of car you need and continue with your booking.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {carOptions.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/5">
                  <Icon
                    className="h-5 w-5 text-slate-900"
                    aria-hidden="true"
                  />
                </div>
              </div>


            </article>
          );
        })}
      </div>
    </section>
  );
}
