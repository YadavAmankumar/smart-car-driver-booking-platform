"use client";

import { Card, CardContent } from "@/components/ui/primitives";

export default function CustomerWelcomeCard({
  name,
  greeting,
  totalBookings,
}: {
  name: string;
  greeting: string;
  totalBookings: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED]" />
      <CardContent className="p-6">
        <p className="text-sm font-semibold text-[#2563EB]">
          {greeting}{""}
          {name ? `,` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          {name ? `Welcome back, ${name} 👋` : "Welcome"}
        </h1>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">Total Bookings</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {totalBookings}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-600">Track status</div>
            <div className="mt-1 text-sm text-slate-700">Pending → Confirmed → Completed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

