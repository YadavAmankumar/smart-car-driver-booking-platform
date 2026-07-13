"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import { ArrowRight, Car } from "lucide-react";

import { redirectToBookingOrLogin } from "@/lib/bookingAuth";

export default function Hero() {

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-white" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <Car className="h-4 w-4 text-slate-900" aria-hidden="true" />
              Premium car + trusted chauffeurs
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Book a driver. Ride in comfort.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              SmartDrive helps you choose the right service, book your date, and
              start your trip with an assigned professional driver.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={redirectToBookingOrLogin}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </button>

              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Explore Services
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["On-time dispatch", "Verified drivers", "Airport & local rides", "Outstation options"].map(
                (t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    {t}
                  </div>
                ),
              )}
            </div>
          </motion.div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            <div className="relative h-full w-full">
              {/* Professional transport image placeholder */}
              <Image
                src="/file.svg"
                alt="Professional transport"
                fill
                className="object-cover opacity-80"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">Ready-to-go dispatch</p>
                <p className="mt-1 text-xs text-slate-600">
                  Choose your service and we’ll assign a driver.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

