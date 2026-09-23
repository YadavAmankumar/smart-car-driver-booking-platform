"use client";

import { ArrowRight, Headphones, Route, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { redirectToBookingOrLogin } from "@/lib/bookingAuth";

type Role = "customer" | "driver" | "admin";

type Service = {
  title:
    | "Driver Only"
    | "Car + Driver"
    | "Local Ride"
    | "Outstation";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const services: Service[] = [
  {
    title: "Driver Only",
    description: "Book a professional driver for your own car.",
    icon: Timer,
  },
  {
    title: "Car + Driver",
    description: "Book a car with a professional driver for your trip.",
    icon: Route,
  },
  {
    title: "Local Ride",
    description: "Convenient local travel within the city.",
    icon: ShieldCheck,
  },
  {
    title: "Outstation",
    description: "Comfortable travel for trips outside the city.",
    icon: Headphones,
  },
];

function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;

  const rawRole = localStorage.getItem("role");

  if (rawRole === "customer" || rawRole === "driver" || rawRole === "admin") {
    return rawRole;
  }

  return null;
}

export default function Services() {
  const [authRole, setAuthRole] = useState<Role | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthRole(getStoredRole());
  }, []);

  const canBook = authRole !== "driver" && authRole !== "admin";

  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Services</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Choose the ride that fits your plans
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Choose a service that fits your trip and book your driver in minutes.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => {
          const Icon = s.icon;

          return (
            <article
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
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

              {canBook && (
                <button
                  type="button"
                  onClick={redirectToBookingOrLogin}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-slate-600"
                >
                  Book this service
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
