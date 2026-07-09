"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
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
      <main className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              My Bookings
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              View your booking history and track their progress.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
            No bookings found.
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


