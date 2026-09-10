"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  completeDriverBooking,
  confirmDriverCashCollection,
  confirmDriverOnlinePayment,
  getAxiosErrorMessage,
  getCustomerProfile,
  getDriverDashboard,
  startDriverBooking,
  updateDriverAvailability,
  type DriverBooking,
  type DriverDashboardData,
} from "@/lib/api";
import { clearSession } from "@/lib/session";

const navItems = [
  "Dashboard",
  "My Profile",
  "My Bookings",
  "Assigned Car",
  "Trip Details",
  "Payment/Cash Collection",
  "Earnings/History",
];

function DriverShell({
  children,
  onLogout,
  driverName,
}: {
  children: ReactNode;
  onLogout: () => void;
  driverName?: string;
}) {
  return (
    <main className="min-h-[70vh] bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 md:block">
          <div className="mb-6">
            <p className="text-sm font-bold text-slate-900">
              {driverName || "Driver"}
            </p>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>

          <nav
            className="flex flex-col gap-1"
            aria-label="Driver dashboard"
          >
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item
                  .toLowerCase()
                  .replaceAll("/", "-")
                  .replaceAll(" ", "-")}`}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {item}
              </a>
            ))}

            <button
              type="button"
              onClick={onLogout}
              className="mt-4 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}

function formatMoney(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function bookingTitle(booking: DriverBooking) {
  return `${booking.pickupLocation || "Pickup"} to ${
    booking.dropLocation || "Drop"
  }`;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [data, setData] = useState<DriverDashboardData | null>(null);

  const refresh = async () => {
    const res = await getDriverDashboard();
    setData(res.data);
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

        await refresh();
      } catch {
        if (!mounted) return;

        toast.error("Please login to access your dashboard");
        router.replace("/login/driver");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  const nextTrip = useMemo(
    () =>
      data?.assignedBookings?.find((booking) =>
        ["Confirmed", "Ongoing"].includes(
          String(booking.bookingStatus),
        ),
      ) ?? data?.upcomingTrips?.[0],
    [data],
  );

  const logout = () => {
    clearSession();
    router.replace("/");
  };

  const runBookingAction = async (
    id: string,
    action: "start" | "complete",
  ) => {
    try {
      setBusy(`${action}:${id}`);

      if (action === "start") {
        await startDriverBooking(id);
      } else {
        await completeDriverBooking(id);
      }

      toast.success(
        action === "start" ? "Trip started" : "Trip completed",
      );

      await refresh();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleAvailability = async () => {
    if (!data?.driver.status) return;

    const nextStatus =
      data.driver.status === "Available"
        ? "Busy"
        : "Available";

    try {
      setBusy("availability");

      await updateDriverAvailability(nextStatus);

      toast.success("Availability updated");

      await refresh();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const completedBookingIds = useMemo(() => {
    return new Set(
      (data?.completedTrips ?? [])
        .map((booking) => booking._id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [data]);

  const bookingIdFromPayment = (payment: {
    bookingId?: unknown;
  }) => {
    if (!payment.bookingId) return "";

    if (typeof payment.bookingId === "string") {
      return payment.bookingId;
    }

    if (
      typeof payment.bookingId === "object" &&
      "_id" in payment.bookingId
    ) {
      const id = (payment.bookingId as { _id?: unknown })._id;

      return typeof id === "string" ? id : "";
    }

    return "";
  };

  const collectCash = async (paymentId: string) => {
    try {
      setBusy(`cash:${paymentId}`);

      await confirmDriverCashCollection(paymentId);

      toast.success("Cash collection confirmed");

      await refresh();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <DriverShell
      onLogout={logout}
      driverName={data?.driver?.driverName}
    >
      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-3 text-slate-600">
            <LoadingSpinner />
            Loading driver dashboard...
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          <section
            id="dashboard"
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Welcome, {data.driver.driverName || "Driver"}
              </h1>

              <p className="text-sm text-slate-600">
                Assigned trips, profile, payments, and earnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                tone={
                  data.driver.status === "Available"
                    ? "green"
                    : "amber"
                }
              >
                {data.driver.status}
              </Badge>

              <Button
                type="button"
                variant="secondary"
                disabled={busy === "availability"}
                onClick={() => void toggleAvailability()}
              >
                {busy === "availability"
                  ? "Updating..."
                  : `Set ${
                      data.driver.status === "Available"
                        ? "Busy"
                        : "Available"
                    }`}
              </Button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Assigned", data.summary.assignedCount],
              ["Today", data.summary.todayCount],
              ["Upcoming", data.summary.upcomingCount],
              ["Completed", data.summary.completedCount],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent>
                  <p className="text-xs font-semibold text-slate-500">
                    {label}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section
            id="my-profile"
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {data.driver.driverName ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {data.driver.phoneNumber ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Experience:</span>{" "}
                  {data.driver.experience ?? 0} yrs
                </p>
              </CardContent>
            </Card>

            <Card id="assigned-car">
              <CardHeader>
                <CardTitle>Assigned Car</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-slate-700">
                {nextTrip?.car ? (
                  <>
                    <p>
                      <span className="font-semibold">Car:</span>{" "}
                      {nextTrip.car.carName ?? "-"}
                    </p>

                    <p>
                      <span className="font-semibold">Number:</span>{" "}
                      {nextTrip.car.carNumber ?? "-"}
                    </p>

                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {nextTrip.car.carType ?? "-"}
                    </p>
                  </>
                ) : (
                  <p>No car assigned for the next trip.</p>
                )}
              </CardContent>
            </Card>

            <Card id="earnings-history">
              <CardHeader>
                <CardTitle>Earnings/History</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Paid:</span>{" "}
                  {formatMoney(data.summary.paidEarnings)}
                </p>

                <p>
                  <span className="font-semibold">Pending:</span>{" "}
                  {formatMoney(data.summary.pendingAmount)}
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="my-bookings">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {data.assignedBookings.length ? (
                  data.assignedBookings.map((booking) => {
                    const id = booking._id ?? "";

                    return (
                      <div
                        key={id}
                        id="trip-details"
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {bookingTitle(booking)}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {booking.bookingDate
                                ? new Date(
                                    booking.bookingDate,
                                  ).toLocaleDateString()
                                : "-"}{" "}
                              at {booking.pickupTime ?? "-"}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              Customer:{" "}
                              {booking.customer?.name ??
                                booking.customerName ??
                                "-"}{" "}
                              ·{" "}
                              {booking.customer?.phone ??
                                booking.mobileNumber ??
                                "-"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">
                              {booking.bookingStatus ?? "-"}
                            </Badge>

                            {booking.bookingStatus === "Confirmed" ? (
                              <Button
                                size="sm"
                                type="button"
                                disabled={busy === `start:${id}`}
                                onClick={() =>
                                  void runBookingAction(id, "start")
                                }
                              >
                                Start
                              </Button>
                            ) : null}

                            {booking.bookingStatus === "Ongoing" ? (
                              <Button
                                size="sm"
                                type="button"
                                disabled={busy === `complete:${id}`}
                                onClick={() =>
                                  void runBookingAction(
                                    id,
                                    "complete",
                                  )
                                }
                              >
                                Complete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-600">
                    No assigned bookings yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section id="payment-cash-collection">
  <Card>
    <CardHeader>
      <CardTitle>Payment / Collection</CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
      {data.payments.length ? (
        data.payments.map((payment) => {
          const paymentId = payment._id;
          const paymentBookingId =
            bookingIdFromPayment(payment);

          const isCompletedBooking =
            payment.bookingStatus === "Completed" ||
            completedBookingIds.has(paymentBookingId);

          const isPendingCash =
            payment.paymentMethod === "Cash" &&
            payment.paymentStatus === "Pending";

          const isPendingUpi =
            payment.paymentMethod === "UPI" &&
            ["Pending", "Verification Pending"].includes(
              payment.paymentStatus || "",
            );

          const canConfirmCash =
            Boolean(paymentId) &&
            isCompletedBooking &&
            isPendingCash;

          const canConfirmUpi =
            Boolean(paymentId) &&
            isCompletedBooking &&
            isPendingUpi;

          const isCashBusy =
            paymentId && busy === `cash:${paymentId}`;

          const isUpiBusy =
            paymentId && busy === `upi:${paymentId}`;

          return (
            <div
              key={paymentId}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {formatMoney(payment.amount)}
                  </p>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {payment.paymentMethod}
                  </span>
                </div>

                <p className="text-sm text-slate-600">
                  Payment status:{" "}
                  <span className="font-medium text-slate-900">
                    {payment.paymentStatus}
                  </span>
                </p>

                {payment.paymentMethod === "Cash" &&
                payment.paymentStatus === "Pending" ? (
                  <p className="text-xs text-amber-600">
                    Collect cash from customer after completing
                    the trip.
                  </p>
                ) : null}

                {payment.paymentMethod === "UPI" &&
                payment.paymentStatus !== "Paid" ? (
                  <p className="text-xs text-blue-600">
                    Customer pays using the business QR and shows
                    the successful payment to you.
                  </p>
                ) : null}

                {payment.paymentStatus === "Paid" ? (
                  <p className="text-xs font-medium text-emerald-600">
                    Payment confirmed successfully.
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 gap-2">
                {canConfirmCash && paymentId ? (
                  <Button
                    size="sm"
                    type="button"
                    disabled={Boolean(isCashBusy)}
                    onClick={() =>
                      void collectCash(paymentId)
                    }
                  >
                    {isCashBusy
                      ? "Confirming..."
                      : "Confirm Cash"}
                  </Button>
                ) : null}

                {canConfirmUpi && paymentId ? (
                  <Button
                    size="sm"
                    type="button"
                    disabled={Boolean(isUpiBusy)}
                    onClick={() =>
                      void confirmDriverOnlinePayment(
                        paymentId,
                      )
                    }
                  >
                    {isUpiBusy
                      ? "Confirming..."
                      : "Confirm Online Payment"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-slate-600">
          No payment records yet.
        </p>
      )}
    </CardContent>
  </Card>
</section>
        </div>
      ) : null}
    </DriverShell>
  );
}