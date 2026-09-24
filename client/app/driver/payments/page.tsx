"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  confirmDriverCashCollection,
  confirmDriverOnlinePayment,
  getCustomerProfile,
  getDriverDashboard,
  type PaymentRecord,
} from "@/lib/api";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

function getBookingId(bookingId: unknown) {
  if (!bookingId) return "N/A";

  if (typeof bookingId === "string") {
    return bookingId;
  }

  if (typeof bookingId === "object" && bookingId !== null && "_id" in bookingId) {
    const value = (bookingId as { _id?: unknown })._id;
    return typeof value === "string" ? value : "N/A";
  }

  return "N/A";
}

function getBookingStatus(bookingId: unknown) {
  if (
    typeof bookingId === "object" &&
    bookingId !== null &&
    "bookingStatus" in bookingId
  ) {
    const value = (bookingId as { bookingStatus?: unknown }).bookingStatus;
    return typeof value === "string" ? value : undefined;
  }

  return undefined;
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

function formatAmount(value?: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

export default function DriverPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const profileResponse = await getCustomerProfile();

      if (profileResponse.user?.role !== "driver") {
        window.location.href = "/login/driver";
        return;
      }

      const dashboardResponse = await getDriverDashboard();

      setPayments(dashboardResponse.data?.payments ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load payment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPayments();
  }, []);

  const handleCashCollection = async (paymentId: string) => {
    try {
      setBusyId(paymentId);

      const response = await confirmDriverCashCollection(paymentId);

      toast.success(
        response.message ?? "Cash collected and payment marked as paid.",
      );

      await loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Unable to confirm cash collection.");
    } finally {
      setBusyId(null);
    }
  };

  const handleOnlinePayment = async (paymentId: string) => {
    try {
      setBusyId(paymentId);

      const response = await confirmDriverOnlinePayment(paymentId);

      toast.success(
        response.message ?? "Online payment confirmed successfully.",
      );

      await loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Unable to confirm online payment.");
    } finally {
      setBusyId(null);
    }
  };

  const activePayment = payments.find(
    (payment) => getBookingStatus(payment.bookingId) === "Ongoing",
  );

  const pendingPayments = activePayment
    ? [activePayment].filter(
        (payment) =>
          payment.paymentStatus === "Pending" ||
          payment.paymentStatus === "Verification Pending",
      )
    : [];

  const paidCash = payments
    .filter(
      (payment) =>
        payment.paymentMethod === "Cash" && payment.paymentStatus === "Paid",
    )
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const paidOnline = payments
    .filter(
      (payment) =>
        payment.paymentMethod === "UPI" && payment.paymentStatus === "Paid",
    )
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const overallPaid = paidCash + paidOnline;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payment / Cash Collection
          </h1>
          <p className="text-sm text-slate-500">
            Loading payment records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Payment / Cash Collection
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Confirm customer payments after the actual cash or online payment is
          received.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cash Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(paidCash)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Online / UPI Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(paidOnline)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(overallPaid)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pending payments: {pendingPayments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>

        <CardContent>
          {payments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="font-semibold text-slate-700">
                No payment records found.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Payment records will appear here for your assigned bookings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePayment ? (
                (() => {
                  const payment = activePayment;
                  const paymentId = payment._id ?? "active-payment";
                const isCash = payment.paymentMethod === "Cash";
                const isOnline = payment.paymentMethod === "UPI";
                const isPending =
                  payment.paymentStatus === "Pending" ||
                  payment.paymentStatus === "Verification Pending";
                const isPaid = payment.paymentStatus === "Paid";
                const bookingStatus = getBookingStatus(payment.bookingId);

                return (
                  <div
                    key={paymentId}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500">Booking ID</p>
                          <p className="font-semibold text-slate-900">
                            {getBookingId(payment.bookingId)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Payment Method
                          </p>
                          <p className="font-semibold text-slate-900">
                            {payment.paymentMethod ?? "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-900">
                            {formatAmount(payment.amount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Payment Status
                          </p>
                          <p
                            className={`font-semibold ${
                              isPaid
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            {payment.paymentStatus ?? "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Booking Status
                          </p>
                          <p className="font-semibold text-slate-900">
                            {bookingStatus ?? "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Created</p>
                          <p className="font-semibold text-slate-900">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>

                        {payment.transactionId && (
                          <div>
                            <p className="text-xs text-slate-500">
                              Transaction ID
                            </p>
                            <p className="break-all font-semibold text-slate-900">
                              {payment.transactionId}
                            </p>
                          </div>
                        )}

                        {payment.verificationStatus && (
                          <div>
                            <p className="text-xs text-slate-500">
                              Verification
                            </p>
                            <p className="font-semibold text-slate-900">
                              {payment.verificationStatus}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="lg:w-64">
                        {isCash &&
                        payment.paymentStatus === "Pending" &&
                        bookingStatus === "Ongoing" ? (
                          <Button
                            className="w-full"
                            disabled={busyId === paymentId}
                            onClick={() =>
                              payment._id &&
                              handleCashCollection(payment._id)
                            }
                          >
                            {busyId === paymentId
                              ? "Confirming..."
                              : "Cash Collected"}
                          </Button>
                        ) : isOnline && isPending ? (
                          <Button
                            className="w-full"
                            disabled={busyId === paymentId}
                            onClick={() =>
                              payment._id &&
                              handleOnlinePayment(payment._id)
                            }
                          >
                            {busyId === paymentId
                              ? "Confirming..."
                              : "Confirm UPI Payment"}
                          </Button>
                        ) : isPaid ? (
                          <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                            {payment.verifiedType === "Cash Collection"
                              ? `Cash Collected by ${payment.verifiedBy?.driverName ?? payment.verifiedBy?.name ?? "Driver"}`
                              : payment.verifiedType === "UPI Driver Confirmation"
                                ? `UPI Verified by ${payment.verifiedBy?.driverName ?? payment.verifiedBy?.name ?? "Driver"}`
                                : "Payment confirmed and marked as Paid."}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-600">
                            No action required at this stage.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                })()
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <p className="font-semibold text-slate-700">
                    No active payment
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Payment details will appear when you have an ongoing trip.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
