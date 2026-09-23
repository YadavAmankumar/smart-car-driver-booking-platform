"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getDriverBookings,
  getCustomerProfile,
  startDriverBooking,
  type DriverBooking,
} from "@/lib/api";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { getAxiosErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value?: number) {
  if (typeof value !== "number") return "—";

  return `₹${value.toLocaleString("en-IN")}`;
}

function getBookingId(booking: DriverBooking) {
  return booking._id ?? "";
}

export default function DriverTripsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTrips = async () => {
    try {
      setLoading(true);

      const profileResponse = await getCustomerProfile();

      if (!profileResponse.success || profileResponse.user?.role !== "driver") {
        router.replace("/login/driver");
        return;
      }

      const response = await getDriverBookings();

      if (response.success) {
        setBookings(response.data ?? []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      toast.error(getAxiosErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trips = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = a.bookingDate
        ? new Date(a.bookingDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.bookingDate
        ? new Date(b.bookingDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });
  }, [bookings]);

  const handleStart = async (bookingId: string) => {
    try {
      setBusyId(bookingId);

      const response = await startDriverBooking(bookingId);

      if (response.success) {
        toast.success(response.message ?? "Trip started successfully.");
        await loadTrips();
      }
    } catch (error) {
      toast.error(getAxiosErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading trip details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trip Details</h1>
        <p className="mt-1 text-sm text-slate-500">
          View assigned trip details and manage the trip lifecycle.
        </p>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-slate-900">
              No assigned trips
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Assigned trips will appear here once the admin assigns them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {trips.map((booking) => {
            const bookingId = getBookingId(booking);
            const customerName =
              booking.customer?.name ?? booking.customerName ?? "—";
            const customerPhone =
              booking.customer?.phone ?? booking.mobileNumber ?? "—";

            const fare = booking.totalAmount ?? booking.estimatedFare;

            const isStarting =
              busyId === bookingId && booking.bookingStatus === "Confirmed";

            return (
              <Card key={bookingId || `${booking.bookingDate}-${customerName}`}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>
                        {booking.serviceType ?? "Trip"}
                      </CardTitle>

                      {bookingId && (
                        <p className="mt-1 text-xs text-slate-500">
                          Booking ID: {bookingId}
                        </p>
                      )}
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        booking.bookingStatus === "Completed"
                          ? "bg-green-100 text-green-700"
                          : booking.bookingStatus === "Ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : booking.bookingStatus === "Confirmed"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {booking.bookingStatus ?? "Unknown"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {customerName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Customer Phone
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {customerPhone}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Pickup
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.pickupLocation ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Drop
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.dropLocation ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Booking Date
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {formatDate(booking.bookingDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Pickup Time
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.pickupTime ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Service Type
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {booking.serviceType ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Car Type
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.carType ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Assigned Car
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {booking.car?.carName ?? "No car assigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Car Number
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.car?.carNumber ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Fare
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatAmount(fare)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Payment Method
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {booking.paymentMethod ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Payment Status
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {booking.paymentStatus ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Started At
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {formatDate(booking.startedAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Completed At
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {formatDate(booking.completedAt)}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Notes
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    {booking.bookingStatus === "Confirmed" && bookingId && (
                      <Button
                        type="button"
                        onClick={() => void handleStart(bookingId)}
                        disabled={busyId !== null}
                      >
                        {isStarting ? "Starting Trip..." : "Start Trip"}
                      </Button>
                    )}

                    {booking.bookingStatus === "Completed" && (
                      <p className="flex items-center text-sm font-semibold text-green-700">
                        Trip completed
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
