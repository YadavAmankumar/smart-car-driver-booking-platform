"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives";
import BookingStatusBadges from "./BookingStatusBadges";

export type RecentBooking = {
  _id?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  bookingStatus?: string;
  paymentMethod?: string;
  serviceType?: string;
  carType?: string;
  createdAt?: string;
};

function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString();
}

export default function RecentBookingsList({
  bookings,
}: {
  bookings: RecentBooking[];
}) {
  const last5 = useMemo(() => bookings.slice(0, 5), [bookings]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
            <p className="mt-2 text-sm text-slate-600">Last 5 rides you requested.</p>
          </div>
          <Badge tone="neutral" className="h-6">
            {bookings.length} total
          </Badge>
        </div>

        <div className="mt-5 space-y-3">
          {last5.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No bookings yet.
            </div>
          ) : (
            last5.map((b) => (
              <div
                key={b._id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Booking ID: {b._id || "-"}
                      </p>
                      <BookingStatusBadges status={b.bookingStatus || "Pending"} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      <span className="font-medium text-slate-600">Pickup:</span>{" "}
                      {b.pickupLocation || "-"}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-600">Drop:</span>{" "}
                      {b.dropLocation || "-"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="text-xs font-semibold text-slate-500">
                      {formatDate(b.bookingDate || b.createdAt)}
                      {b.pickupTime ? ` • ${b.pickupTime}` : ""}
                    </div>
                    <Button
                      asChild
                      variant="secondary"
                      className="rounded-lg px-4"
                    >
                      <Link href={`/bookings/${b._id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {b.serviceType ? (
                    <Badge tone="neutral">{b.serviceType}</Badge>
                  ) : null}
                  {b.paymentMethod ? (
                    <Badge tone="neutral">Payment: {b.paymentMethod}</Badge>
                  ) : (
                    <Badge tone="neutral">Payment: -</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

