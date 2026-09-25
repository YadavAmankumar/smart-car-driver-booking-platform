"use client";

import { useState } from "react";

type CarOption = {
  title: string;
  description: string;
  image: string;
  details: {
    seating: string;
    vehicleType: string;
    suitableFor: string;
  };
};

const carOptions: CarOption[] = [
  {
    title: "Mini",
    description: "Compact cars for everyday city travel.",
    image: "/images/cars/mini-car.png",
    details: {
      seating: "Up to 4 passengers",
      vehicleType: "Compact Car",
      suitableFor: "City trips, short journeys and small families",
    },
  },
  {
    title: "Sedan",
    description: "Comfortable cars for city and longer journeys.",
    image: "/images/cars/sedan-car.png",
    details: {
      seating: "4–5 passengers",
      vehicleType: "Sedan",
      suitableFor: "City travel, outstation trips and airport transfers",
    },
  },
  {
    title: "XL – 7 Seater",
    description: "Spacious vehicles for families and small groups.",
    image: "/images/cars/xl-7-seater.png",
    details: {
      seating: "6–7 passengers",
      vehicleType: "SUV / MPV",
      suitableFor: "Family trips and longer journeys",
    },
  },
  {
    title: "Group Travel",
    description: "Larger vehicles for group journeys, tours and events.",
    image: "/images/cars/force-traveller.png",
    details: {
      seating: "Multiple passengers",
      vehicleType: "Force Traveller",
      suitableFor: "Group journeys, tours and events",
    },
  },
];

export default function Car() {
  const [selectedCar, setSelectedCar] = useState<CarOption | null>(null);

  return (
    <section id="fleet" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Car</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Choose a car that fits your trip
        </h2>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {carOptions.map((item) => (
          <article
            key={item.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          >
            <div className="h-56 overflow-hidden bg-slate-50">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-contain p-4"
              />
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>

              <button
                type="button"
                onClick={() => setSelectedCar(item)}
                className="mt-5 inline-flex items-center text-sm font-semibold text-[#2563EB] transition-colors hover:text-[#0F172A]"
              >
                Learn More →
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedCar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedCar(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="car-dialog-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#2563EB]">
                  Car Information
                </p>
                <h3
                  id="car-dialog-title"
                  className="mt-1 text-xl font-bold text-[#0F172A]"
                >
                  {selectedCar.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCar(null)}
                className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900">Seating</p>
                <p className="mt-1 text-slate-600">
                  {selectedCar.details.seating}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">Vehicle Type</p>
                <p className="mt-1 text-slate-600">
                  {selectedCar.details.vehicleType}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">Suitable For</p>
                <p className="mt-1 text-slate-600">
                  {selectedCar.details.suitableFor}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCar(null)}
              className="mt-6 w-full rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
