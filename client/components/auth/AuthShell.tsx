"use client";

import { CarFront, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] lg:grid-cols-[0.9fr_1.1fr]">

          {/* Brand Panel */}
          <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.03]" />

            <div className="relative">
              {/* SmartDrive Branding */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950">
                  <CarFront className="h-6 w-6" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-lg font-extrabold tracking-tight">
                    SMARTDRIVE
                  </p>

                  <p className="text-xs text-slate-400">
                    Car & Driver Booking
                  </p>
                </div>
              </div>

              {/* Brand Message */}
              <div className="mt-16 max-w-sm">
                <p className="text-sm font-medium text-slate-400">
                  Drive. Ride. Arrive.
                </p>

                <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
                  Your journey,
                  <br />
                  made simple.
                </h2>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  Book professional drivers and comfortable cars for local,
                  outstation, and everyday travel.
                </p>
              </div>

              {/* Benefits */}
              <div className="mt-8 space-y-3">
                {[
                  "Professional drivers",
                  "Comfortable cars",
                  "Simple booking experience",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-white"
                      aria-hidden="true"
                    />

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Footer */}
            <p className="relative text-xs text-slate-500">
              SmartDrive • Reliable travel, made easy.
            </p>
          </div>

          {/* Form Panel */}
          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
            <div className="w-full max-w-lg">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="px-0 pb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      SmartDrive
                    </p>

                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {title}
                    </CardTitle>

                    {subtitle ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="px-0">
                  {children}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}