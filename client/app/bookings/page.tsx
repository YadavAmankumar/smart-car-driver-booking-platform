"use client";

import { useEffect, useState } from "react";
import { getAllBookings } from "@/lib/api";
import toast from "react-hot-toast";

type Booking = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
  carType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
  bookingStatus?: string;
  notes?: string;
  createdAt?: string;
};

export default function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await getAllBookings();
        if (!mounted) return;
        setBookings(Array.isArray(res?.data) ? res.data : []);
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }


    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          My Bookings
        </h1>
        <p className="mt-3 text-slate-600">
          View your recent bookings.
        </p>

        {isLoading ? (
          <div className="mt-8 text-slate-600">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="mt-8 text-slate-600">No bookings found.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => (
              <article
                key={b._id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {b.customerName || "Customer"}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {b.mobileNumber}
                    </p>
                  </div>
                  <span className="text-xs font-semibold rounded-full px-3 py-1 bg-slate-100 text-slate-800">
                    {b.bookingStatus || "Pending"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Service:</span>{" "}
                    {b.serviceType}
                  </div>
                  {b.carType ? (
                    <div>
                      <span className="font-medium">Vehicle:</span>{" "}
                      {b.carType}
                    </div>
                  ) : null}
                  <div>
                    <span className="font-medium">Pickup:</span>{" "}
                    {b.pickupLocation}
                  </div>
                  <div>
                    <span className="font-medium">Drop:</span>{" "}
                    {b.dropLocation}
                  </div>
                  <div>
                    <span className="font-medium">Date/Time:</span>{" "}
                    {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : ""}
                    {b.pickupTime ? ` • ${b.pickupTime}` : ""}
                  </div>
                  {b.paymentMethod ? (
                    <div>
                      <span className="font-medium">Payment:</span>{" "}
                      {b.paymentMethod}
                    </div>
                  ) : null}
                  {b.notes ? (
                    <div>
                      <span className="font-medium">Notes:</span>{" "}
                      {b.notes}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

