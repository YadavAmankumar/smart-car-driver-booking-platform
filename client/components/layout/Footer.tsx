"use client";

import { Mail, MapPin, Phone } from "lucide-react";

import { redirectToBookingOrLogin } from "@/lib/bookingAuth";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {



  return (
    <footer className="border-t border-slate-200 bg-white">

      <div className="mx-auto max-w-6xl px-4 py-10" id="contact">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {siteConfig.companyName}
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Reliable car & driver booking for local rides, airport transfers, and
              outstation trips.
            </p>
            <p className="mt-4 text-xs text-slate-500">{siteConfig.copyright}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Contact</p>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {siteConfig.phone ? (
                <div className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 h-4 w-4 text-slate-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-slate-600">{siteConfig.phone}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-slate-600">{siteConfig.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-slate-600">{siteConfig.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={redirectToBookingOrLogin}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 md:w-auto"
              >
                Book Now
              </button>

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



