"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui/primitives";
import { getAdminPayments, verifyAdminUpiPayment, type PaymentRecord } from "@/lib/api";

function money(amount?: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof amount === "number" ? amount : 0);
}

function statusTone(status?: string): "neutral" | "blue" | "green" | "amber" | "red" {
  if (status === "Paid") return "green";
  if (status === "Verification Pending") return "amber";
  if (status === "Rejected" || status === "Cancelled") return "red";
  if (status === "Refunded") return "blue";
  return "neutral";
}

function bookingLabel(payment: PaymentRecord) {
  const booking = payment.bookingId as { _id?: string; customerName?: string } | undefined;
  return booking?.customerName || booking?._id || "-";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getAdminPayments();
      setPayments(res.data || []);
    } catch {
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  const verificationPending = useMemo(
    () => payments.filter((payment) => payment.paymentStatus === "Verification Pending").length,
    [payments],
  );

  async function verify(paymentId: string | undefined, action: "approve" | "reject") {
    if (!paymentId || workingId) return;
    setWorkingId(paymentId);
    try {
      const res = await verifyAdminUpiPayment(paymentId, action, remarks[paymentId]);
      setPayments((current) => current.map((payment) => payment._id === paymentId ? res.data : payment));
      toast.success(action === "approve" ? "UPI payment approved." : "UPI payment rejected.");
    } catch {
      toast.error("Unable to update UPI payment.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review cash collections and manually verify UPI transaction IDs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600">Total Payments</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600">UPI Awaiting Verification</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{verificationPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600">Paid Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {money(payments.reduce((sum, payment) => payment.paymentStatus === "Paid" ? sum + (payment.amount || 0) : sum, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No payments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Booking / Customer</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">UTR</th>
                    <th className="px-4 py-3">Admin Remarks</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const canVerify = payment.paymentMethod === "UPI" && payment.paymentStatus === "Verification Pending";
                    return (
                      <tr key={payment._id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{bookingLabel(payment)}</td>
                        <td className="px-4 py-3 text-slate-700">{payment.paymentMethod || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{money(payment.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(payment.paymentStatus)}>{payment.paymentStatus || "Pending"}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{payment.transactionId || "-"}</td>
                        <td className="px-4 py-3">
                          <Input
                            value={remarks[payment._id || ""] ?? ""}
                            onChange={(event) => setRemarks((current) => ({ ...current, [payment._id || ""]: event.target.value }))}
                            placeholder="Optional note"
                            disabled={!canVerify}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={!canVerify || workingId === payment._id}
                              onClick={() => void verify(payment._id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={!canVerify || workingId === payment._id}
                              onClick={() => void verify(payment._id, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
