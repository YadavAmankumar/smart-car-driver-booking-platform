"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives";
import BookingStatusBadges from "./BookingStatusBadges";

export type CustomerBooking = {
  _id?: string;
  pickupLocation?: string;
  dropLocation?: string;
  serviceType?: string;
  bookingDate?: string;
  pickupTime?: string;
  bookingStatus?: string;
  paymentMethod?: string;
  driver?: { name?: string } | string;
  car?: { name?: string } | string;
  carType?: string;
};

export default function CustomerBookingCard({
  booking,
}: {
  booking: CustomerBooking;
}) {
  const [isCancelling] = useState(false);


  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                Booking ID: {booking._id || "-"}
              </p>
              <BookingStatusBadges status={booking.bookingStatus || "Pending"} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Pickup:</span>{" "}
                {booking.pickupLocation || "-"}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Drop:</span>{" "}
                {booking.dropLocation || "-"}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Service:</span>{" "}
                {booking.serviceType || "-"}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Date:</span>{" "}
                {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : "-"}
                {booking.pickupTime ? ` • ${booking.pickupTime}` : ""}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Payment:</span>{" "}
                {booking.paymentMethod || "-"}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Driver:</span>{" "}
                {typeof booking.driver === "string" ? booking.driver : booking.driver?.name || "-"}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium text-slate-600">Car:</span>{" "}
                {typeof booking.car === "string"
                  ? booking.car
                  : booking.carType || booking.car?.name || "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{booking.serviceType || "Service"}</Badge>
            <Badge tone="neutral">{booking.paymentMethod || "Payment"}</Badge>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="secondary" className="rounded-lg px-4">
              <Link href={`/bookings/${booking._id}`}>View Details</Link>
            </Button>

            <Button
              type="button"
              disabled
              variant="secondary"
              className="rounded-lg px-4 opacity-60"
              aria-disabled="true"
              title="Cancellation is not supported for customers with current backend APIs."
            >
              {isCancelling ? "Cancelling…" : "Cancel Booking"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

