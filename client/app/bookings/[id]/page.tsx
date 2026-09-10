"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import BookingStatusBadges from "@/components/customer/BookingStatusBadges";
import BookingTimeline from "@/components/customer/BookingTimeline";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui/primitives";
import {
  cancelBooking,
  getBookingById,
  getPaymentByBooking,
  getPaymentConfig,
  submitUpiUtr,
  type PaymentConfig,
  type PaymentRecord,
} from "@/lib/api";

type BookingDetail = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  email?: string;
  serviceType?: string;
  carType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  createdAt?: string;
  driver?: { name?: string; _id?: string } | string;
  car?: { name?: string; _id?: string; carType?: string } | string;
};

function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString();
}

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);

  const canCancel = booking?.bookingStatus === "Pending" || booking?.bookingStatus === "Confirmed";

  async function handleCancel() {
    if (!booking?._id || !canCancel || cancelling) return;
    if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;

    setCancelling(true);
    try {
      await cancelBooking(booking._id);
      setBooking((current) => current ? { ...current, bookingStatus: "Cancelled" } : current);
      toast.success("Booking cancelled successfully.");
    } catch {
      toast.error("Unable to cancel this booking.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleSubmitUtr() {
    if (!booking?._id || submittingUtr) return;
    setSubmittingUtr(true);
    try {
      const res = await submitUpiUtr(booking._id, utr);
      setPayment(res.data);
      setBooking((current) => current ? { ...current, paymentStatus: res.data.paymentStatus } : current);
      toast.success("UPI transaction submitted for verification.");
    } catch {
      toast.error("Unable to submit UPI transaction ID.");
    } finally {
      setSubmittingUtr(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        if (!id) return;
        const [res, paymentRes, configRes] = await Promise.all([
          getBookingById(id),
          getPaymentByBooking(id).catch(() => null),
          getPaymentConfig().catch(() => null),
        ]);
        if (!mounted) return;
        const b = res?.data ?? res;
        setBooking(b);
        setPayment(paymentRes?.data ?? null);
        setPaymentConfig(configRes?.data ?? null);
      } catch {
        toast.error("Failed to load booking details");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <CustomerDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Booking Details
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              View customer, driver, car, payment and timeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading booking…
          </div>
        ) : booking ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Booking ID</p>
                      <p className="truncate text-lg font-bold text-slate-900">
                        {booking._id || "-"}
                      </p>
                    </div>
                    <BookingStatusBadges
                      status={booking.bookingStatus || "Pending"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-600">Customer Information</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {booking.customerName || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Phone: {booking.mobileNumber || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-600">Ride Information</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {booking.serviceType || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Vehicle: {booking.carType || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-600">Pickup → Drop</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {booking.pickupLocation || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {booking.dropLocation || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-600">Date & Time</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDate(booking.bookingDate || booking.createdAt) || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {booking.pickupTime || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-900">Driver Information</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {typeof booking.driver === "string"
                        ? booking.driver || "Not assigned yet"
                        : booking.driver?.name || booking.driver?._id || "Not assigned yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-900">Car Information</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {typeof booking.car === "string"
                        ? booking.car || booking.carType || "Not assigned yet"
                        : booking.car?.name || booking.car?._id || booking.carType || "Not assigned yet"}
                    </p>
                    {booking.carType ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="neutral">{booking.carType}</Badge>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-bold text-slate-900">Payment Information</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Payment: {booking.paymentMethod || "-"}</Badge>
                    <Badge tone="neutral">Status: {payment?.paymentStatus || booking.paymentStatus || "Pending"}</Badge>
                    {payment?.transactionId ? <Badge tone="neutral">UTR: {payment.transactionId}</Badge> : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <BookingTimeline
                    status={booking.bookingStatus}
                    paymentStatus={payment?.paymentStatus || booking.paymentStatus}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-bold text-slate-900">Summary</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Service</span>
                      <span className="font-semibold text-slate-900">
                        {booking.serviceType || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Pickup</span>
                      <span className="font-semibold text-slate-900">
                        {booking.pickupLocation || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Drop</span>
                      <span className="font-semibold text-slate-900">
                        {booking.dropLocation || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Payment</span>
                      <span className="font-semibold text-slate-900">
                        {booking.paymentMethod || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-bold text-slate-900">Actions</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Pending and confirmed bookings can be cancelled before the trip starts.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      disabled={!canCancel || cancelling}
                      variant="secondary"
                      className="w-full rounded-lg"
                      onClick={handleCancel}
                    >
                      {cancelling ? "Cancelling…" : "Cancel Booking"}
                    </Button>
                  </div>
                  {booking.paymentMethod && booking.paymentMethod !== "Cash" ? (
                    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">UPI QR Payment</p>
                      {paymentConfig?.upiQrImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={paymentConfig.upiQrImageUrl} alt="Business UPI QR code" className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white object-contain p-2" />
                      ) : null}
                      {paymentConfig?.upiId ? (
                        <p className="break-all text-xs text-slate-600">UPI ID: {paymentConfig.upiId}</p>
                      ) : (
                        <p className="text-xs text-amber-700">UPI QR configuration is not available yet.</p>
                      )}
                      <p className="text-xs text-slate-600">
                        Scan with any UPI app, complete payment, then submit the UTR. Admin approval is required before this is marked Paid.
                      </p>
                      <Input
                        value={utr}
                        onChange={(event) => setUtr(event.target.value)}
                        placeholder="Enter UPI transaction ID / UTR"
                        disabled={!["Pending", "Rejected"].includes(payment?.paymentStatus || "Pending")}
                      />
                      <Button
                        type="button"
                        className="w-full rounded-lg"
                        onClick={handleSubmitUtr}
                        disabled={
                          submittingUtr ||
                          booking.bookingStatus === "Cancelled" ||
                          !paymentConfig?.upiId ||
                          !/^[A-Za-z0-9/-]{8,35}$/.test(utr.trim()) ||
                          !["Pending", "Rejected"].includes(payment?.paymentStatus || "Pending")
                        }
                      >
                        {submittingUtr ? "Submitting..." : "Submit UTR for Verification"}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      Pay the assigned driver in cash after the trip is completed. Only the assigned driver can confirm collection.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Booking not found.
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
}
