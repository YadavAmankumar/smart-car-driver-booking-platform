"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from "@/components/ui/primitives";

import {
  getAxiosErrorMessage,
  getCustomerProfile,
  getDriverBookings,
  startDriverBooking,
  completeDriverBooking,
  type DriverBooking,
} from "@/lib/api";

function formatMoney(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusTone(status?: string) {
  switch (status) {
    case "Completed":
      return "green";
    case "Confirmed":
      return "green";
    case "Ongoing":
      return "blue";
    case "Cancelled":
      return "red";
    default:
      return "amber";
  }
}

export default function DriverBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    const res = await getDriverBookings();
    setBookings(res.data || []);
  };

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const profile = await getCustomerProfile();

        if (!mounted) return;

        if (profile.user?.role !== "driver") {
          router.replace(
            profile.user?.role === "admin"
              ? "/admin/dashboard"
              : "/dashboard",
          );
          return;
        }

        const res = await getDriverBookings();

        if (!mounted) return;

        setBookings(res.data || []);
      } catch {
        if (!mounted) return;

        toast.error("Please login to access your bookings");
        router.replace("/login/driver");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  const activeBooking = bookings.find((booking) => {
    const status = String(booking.bookingStatus || "");
    return status === "Confirmed" || status === "Ongoing";
  });

  const handleTripAction = async (
    bookingId: string,
    action: "start" | "complete",
  ) => {
    try {
      setBusy(`${action}:${bookingId}`);

      if (action === "start") {
        await startDriverBooking(bookingId);
        toast.success("Trip started successfully");
      } else {
        await completeDriverBooking(bookingId);
        toast.success("Trip completed successfully");
      }

      await refresh();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <LoadingSpinner />
          <span className="text-sm text-slate-600">
            Loading bookings...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Active Booking
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          View and manage your current assigned trip.
        </p>
      </div>

      {!activeBooking ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No active booking
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Your next confirmed trip will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[activeBooking].map((booking) => {
            const bookingId = booking._id;

            const status = String(
              booking.bookingStatus || "Pending",
            );

            const startBusy =
              bookingId !== undefined &&
              busy === `start:${bookingId}`;

            const completeBusy =
              bookingId !== undefined &&
              busy === `complete:${bookingId}`;

            return (
              <Card key={bookingId || "active-booking"}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>
                        {booking.pickupLocation || "Pickup"} →{" "}
                        {booking.dropLocation || "Drop"}
                      </CardTitle>

                      <p className="mt-1 text-xs text-slate-500">
                        Booking ID: {bookingId || "-"}
                      </p>
                    </div>

                    <Badge tone={getStatusTone(status)}>
                      {status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {booking.customerName || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {booking.mobileNumber || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Service
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {booking.serviceType || "-"}
                      </p>

                      {booking.carType && (
                        <p className="text-xs text-slate-500">
                          {booking.carType}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date & Time
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(booking.bookingDate)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {booking.pickupTime || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Car
                      </p>

                      {booking.car ? (
                        <>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {booking.car.carName || "-"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {booking.car.carNumber || "-"}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          Driver Only
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fare
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatMoney(
                          booking.totalAmount ??
                            booking.estimatedFare,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {booking.paymentMethod || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {booking.paymentStatus || "Pending"}
                      </p>
                    </div>
                  </div>

                  {bookingId &&
                    (status === "Confirmed" ||
                      status === "Ongoing") && (
                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                        {status === "Confirmed" && (
                          <Button
                            type="button"
                            disabled={busy !== null}
                            onClick={() =>
                              void handleTripAction(bookingId, "start")
                            }
                          >
                            {startBusy
                              ? "Starting..."
                              : "Start Trip"}
                          </Button>
                        )}

                        {status === "Ongoing" &&
                          booking.paymentStatus === "Paid" && (
                            <Button
                              type="button"
                              disabled={busy !== null}
                              onClick={() =>
                                void handleTripAction(bookingId, "complete")
                              }
                            >
                              {completeBusy
                                ? "Completing..."
                                : "Complete Trip"}
                            </Button>
                          )}

                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
