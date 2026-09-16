"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  getCustomerProfile,
  getDriverBookings,
  type DriverBooking,
} from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

function formatAmount(value?: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPaymentStatus(booking: DriverBooking) {
  return booking.paymentStatus ?? booking.payment?.paymentStatus ?? "Pending";
}

function getPaymentMethod(booking: DriverBooking) {
  return booking.paymentMethod ?? booking.payment?.paymentMethod ?? "N/A";
}

function getBookingAmount(booking: DriverBooking) {
  return Number(
    booking.totalAmount ??
      booking.estimatedFare ??
      booking.payment?.amount ??
      0,
  );
}

function getPaymentDate(booking: DriverBooking) {
  return (
    booking.payment?.updatedAt ??
    booking.payment?.createdAt ??
    booking.completedAt ??
    booking.createdAt
  );
}

export default function DriverEarningsPage() {
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const profileResponse = await getCustomerProfile();

        if (profileResponse.user?.role !== "driver") {
          window.location.href = "/login/driver";
          return;
        }

        const response = await getDriverBookings();
        setBookings(response.data ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load earnings history.");
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const currentMonthBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((booking) => {
      const dateValue =
        booking.completedAt ??
        booking.payment?.updatedAt ??
        booking.createdAt;

      if (!dateValue) return false;

      const date = new Date(dateValue);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [bookings]);

  const paidBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => getPaymentStatus(booking) === "Paid",
      ),
    [bookings],
  );

  const monthlyPaidBookings = useMemo(
    () =>
      currentMonthBookings.filter(
        (booking) => getPaymentStatus(booking) === "Paid",
      ),
    [currentMonthBookings],
  );

  const monthlyCash = useMemo(
    () =>
      monthlyPaidBookings
        .filter((booking) => getPaymentMethod(booking) === "Cash")
        .reduce((sum, booking) => sum + getBookingAmount(booking), 0),
    [monthlyPaidBookings],
  );

  const monthlyOnline = useMemo(
    () =>
      monthlyPaidBookings
        .filter((booking) => getPaymentMethod(booking) === "UPI")
        .reduce((sum, booking) => sum + getBookingAmount(booking), 0),
    [monthlyPaidBookings],
  );

  const monthlyOverall = monthlyCash + monthlyOnline;

  const monthlyTrips = currentMonthBookings.length;

  const totalPaid = paidBookings.reduce(
    (sum, booking) => sum + getBookingAmount(booking),
    0,
  );

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const dateA = new Date(
          getPaymentDate(a) ?? 0,
        ).getTime();

        const dateB = new Date(
          getPaymentDate(b) ?? 0,
        ).getTime();

        return dateB - dateA;
      }),
    [bookings],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Earnings / History
          </h1>
          <p className="text-sm text-slate-500">
            Loading earnings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Earnings / History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your monthly collections and date-wise trip history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Monthly Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {monthlyTrips}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Monthly Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(monthlyCash)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Monthly Online / UPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(monthlyOnline)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Monthly Overall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(monthlyOverall)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Monthly Cash Collection
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatAmount(monthlyCash)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Monthly Online Collection
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatAmount(monthlyOnline)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Overall Paid Collection
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatAmount(totalPaid)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date-wise Trip History</CardTitle>
        </CardHeader>

        <CardContent>
          {sortedBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="font-semibold text-slate-700">
                No trip history found.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Completed and assigned trips will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBookings.map((booking, index) => {
                const amount = getBookingAmount(booking);
                const paymentStatus = getPaymentStatus(booking);
                const paymentMethod = getPaymentMethod(booking);

                return (
                  <div
                    key={booking._id ?? `booking-${index}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {formatDate(getPaymentDate(booking))}
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {booking.serviceType ?? "Service"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Booking ID: {booking._id ?? "N/A"}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                        <div>
                          <p className="text-xs text-slate-500">
                            Amount
                          </p>
                          <p className="font-bold text-slate-900">
                            {formatAmount(amount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Payment
                          </p>
                          <p className="font-semibold text-slate-900">
                            {paymentMethod}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Status
                          </p>
                          <p
                            className={`font-semibold ${
                              paymentStatus === "Paid"
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            {paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="text-slate-500">
                          Customer:
                        </span>{" "}
                        <span className="font-medium text-slate-800">
                          {booking.customerName ??
                            booking.customer?.name ??
                            "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Pickup:
                        </span>{" "}
                        <span className="font-medium text-slate-800">
                          {booking.pickupLocation ?? "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Drop:
                        </span>{" "}
                        <span className="font-medium text-slate-800">
                          {booking.dropLocation ?? "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Trip Status:
                        </span>{" "}
                        <span className="font-medium text-slate-800">
                          {booking.bookingStatus ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
