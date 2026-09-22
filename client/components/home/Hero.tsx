"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
} from "lucide-react";

import { redirectToBookingOrLogin } from "@/lib/bookingAuth";



export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-slate-100 bg-white"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-50/40 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:pb-20 md:pt-16 lg:px-8 lg:gap-16 lg:pt-20">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.4rem]">
            Book a driver.
            <br />
            <span className="text-slate-500">Ride in comfort.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            SmartDrive makes everyday travel simple. Choose your service,
            schedule your trip, and travel with a professional driver assigned
            to your booking.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={redirectToBookingOrLogin}
              className="group inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-slate-950/20 active:translate-y-0"
            >
              Book Your Ride
              <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>

            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Explore Services
            </a>
          </div>

        </motion.div>

        {/* Right visual */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-white">
              <Image
                src="/images/smartdrive-car.png"
                alt="SmartDrive car"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
