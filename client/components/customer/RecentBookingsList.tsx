"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives";
import BookingStatusBadges from "./BookingStatusBadges";

export type RecentBooking = {
  _id?: string;
  bookingNumber?: string;
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

function formatDate(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentBookingsList({
  bookings,
}: {
  bookings: RecentBooking[];
}) {
  const last5 = useMemo(() => bookings.slice(0, 5), [bookings]);

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest booking activity
            </p>
          </div>

          <Badge tone="neutral" className="h-6 shrink-0">
            {bookings.length} total
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {last5.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No bookings yet.
            </div>
          ) : (
            last5.map((booking) => (
              <div
                key={booking._id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Booking ID:{" "}
                        {booking.bookingNumber || booking._id || "-"}
                      </p>

                      <BookingStatusBadges
                        status={booking.bookingStatus || "Pending"}
                      />
                    </div>

                    <p
                      title={booking.pickupLocation || "-"}
                      className="mt-2 line-clamp-1 text-sm text-slate-700"
                    >
                      <span className="font-medium text-slate-600">
                        Pickup:
                      </span>{" "}
                      {booking.pickupLocation || "-"}
                    </p>

                    <p
                      title={booking.dropLocation || "-"}
                      className="line-clamp-1 text-sm text-slate-700"
                    >
                      <span className="font-medium text-slate-600">
                        Drop:
                      </span>{" "}
                      {booking.dropLocation || "-"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="text-xs font-semibold text-slate-500">
                      {formatDate(
                        booking.bookingDate || booking.createdAt
                      )}

                      {booking.pickupTime
                        ? ` • ${booking.pickupTime}`
                        : ""}
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      className="h-9 rounded-lg px-3 text-xs"
                    >
                      <Link href={`/bookings/${booking._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {booking.serviceType ? (
                    <Badge tone="neutral" className="text-[11px]">
                      {booking.serviceType}
                    </Badge>
                  ) : null}

                  {booking.paymentMethod ? (
                    <Badge tone="neutral" className="text-[11px]">
                      Payment: {booking.paymentMethod}
                    </Badge>
                  ) : (
                    <Badge tone="neutral" className="text-[11px]">
                      Payment: -
                    </Badge>
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