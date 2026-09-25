import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CarFront, UserRound } from "lucide-react";

const services = [
  {
    title: "Driver Only",
    label: "YOUR CAR · OUR DRIVER",
    description:
      "Have your own car? Sit back and enjoy the journey with a professional driver.",
    href: "/booking/driver",
    icon: UserRound,
    image: "/images/cars/Driver Only.png",
    features: [
      "Verified & professional drivers",
      "Flexible hourly bookings",
      "Local, airport & outstation travel",
    ],
  },
  {
    title: "Car with Driver",
    label: "OUR CAR · OUR DRIVER",
    description:
      "Travel in comfort with a well-maintained car and a professional driver.",
    href: "/booking/car-driver",
    icon: CarFront,
    image: "/images/cars/Car with Driver.png",
    features: [
      "Comfortable cars for every journey",
      "AC & Non-AC options available",
      "Local, airport & outstation travel",
    ],
  },
] as const;

export default function ServiceSelection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {services.map(
        ({ title, label, description, href, icon: Icon, image, features }) => (
          <article
            key={href}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Full 16:9 Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
              <Image
                src={image}
                alt={title}
                fill
                priority
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Content */}
            <div className="p-6 sm:p-7">
              {/* Service Label */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
              </div>

              {/* Title */}
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h2>

              {/* Description */}
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {description}
              </p>

              {/* Features */}
              <div className="mt-5 space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm font-medium text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      ✓
                    </span>

                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Book Now */}
              <Link
                href={href}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-black hover:shadow-md sm:text-base"
              >
                Book Now
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>
        ),
      )}
    </div>
  );
}
