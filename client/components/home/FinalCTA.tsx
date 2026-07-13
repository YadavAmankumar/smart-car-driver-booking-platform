"use client";

import { Phone, Sparkles } from "lucide-react";


import { redirectToBookingOrLogin } from "@/lib/bookingAuth";

export default function FinalCTA() {

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16" id="cta">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-700 px-6 py-12 shadow-sm sm:px-10">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -right-10 top-28 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Premium ride dispatch
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to Book Your Ride?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
              Choose your service, pick your timing, and let our verified team handle the rest.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={redirectToBookingOrLogin}
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Book Now
              </button>

              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                Call Us
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">Fast, reliable dispatch</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                Verified drivers and professional chauffeurs
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                GPS-based pickup coordination and smooth communication
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                Premium experience for business travelers and families
              </li>
            </ul>
            <div className="mt-6 text-xs text-white/70">
              Support: 24x7 • Safety-first • Transparent booking
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

