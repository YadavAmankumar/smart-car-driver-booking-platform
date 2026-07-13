"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
import { Button } from "@/components/ui/primitives";
import { getCustomerBookings } from "@/lib/api";


type Booking = {
  _id?: string;
  pickupLocation?: string;
  dropLocation?: string;
  serviceType?: string;
  bookingDate?: string;
  pickupTime?: string;
  bookingStatus?: string;
  paymentMethod?: string;
  driver?: { name?: string; _id?: string } | string;
  car?: { name?: string; _id?: string; carType?: string } | string;
  carType?: string;
};

export default function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await getCustomerBookings();
        if (!mounted) return;
        setBookings(Array.isArray(res?.data) ? res.data : []);
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CustomerDashboardLayout>
      <main className="space-y-6">
        {/* Consistent page header */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">My Bookings</p>
              <p className="text-xs text-slate-600">
                Track and manage all your bookings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/dashboard/customer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span aria-hidden="true">←</span>
                Back
              </a>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    No bookings yet
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    You haven&apos;t booked a ride yet. Start by booking your first ride with us.
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  🧾
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-gradient-to-b from-slate-50 to-white p-5">
                <div className="text-sm font-semibold text-slate-900">
                  Book Your First Ride
                </div>
                <div className="mt-1">
                  <Button
                    asChild
                    variant="primary"
                    className="w-full rounded-xl px-5 py-3"
                  >
                    <Link href="/booking">Book Your First Ride</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((b) => (
              <CustomerBookingCard key={b._id} booking={b} />
            ))}
          </div>
        )}
      </main>
    </CustomerDashboardLayout>
  );
}



