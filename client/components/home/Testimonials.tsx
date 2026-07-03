import { Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Aarav S.",
    role: "Airport transfer",
    quote:
      "On-time pickup and a very professional driver. Smooth experience from terminal to destination.",
  },
  {
    name: "Priya N.",
    role: "Local ride",
    quote:
      "Booking was quick and the driver arrived right as expected. Clean car and friendly communication.",
  },
  {
    name: "Vikram M.",
    role: "Outstation trip",
    quote:
      "Comfortable vehicle and dependable chauffeur for the entire trip. Highly recommended.",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Testimonials</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Trusted by customers
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Real feedback from trips booked through SmartDrive.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <article
            key={t.name}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-1" aria-label="Rating 5 out of 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">“{t.quote}”</p>
            <div className="mt-5">
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.role}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

