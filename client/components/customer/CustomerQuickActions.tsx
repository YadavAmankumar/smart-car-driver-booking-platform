"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui/primitives";

export default function CustomerQuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        <p className="mt-2 text-sm text-slate-600">Manage your rides in seconds.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/booking" className="group">
            <Button
              type="button"
              className="h-auto w-full justify-start rounded-xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
            >
              <span aria-hidden="true">🚗</span>
              <span className="ml-2">Book New Ride</span>
            </Button>
          </Link>

          <Link href="/bookings" className="group">
            <Button
              type="button"
              variant="secondary"
              className="h-auto w-full justify-start rounded-xl border-[#E2E8F0] bg-white px-4 py-3 transition hover:bg-[#F8FAFC]"
            >
              <span aria-hidden="true">🧾</span>
              <span className="ml-2">My Bookings</span>
            </Button>
          </Link>

          <Link href="/profile" className="group">
            <Button
              type="button"
              variant="secondary"
              className="h-auto w-full justify-start rounded-xl border-[#E2E8F0] bg-white px-4 py-3 transition hover:bg-[#F8FAFC]"
            >
              <span aria-hidden="true">👤</span>
              <span className="ml-2">Profile</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

