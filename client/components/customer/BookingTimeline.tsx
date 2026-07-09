"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function BookingTimeline({
  status,
  paymentStatus,
}: {
  status?: string;
  paymentStatus?: string;
}) {
  const s = (status || "Pending").toLowerCase();
  const ps = (paymentStatus || "").toLowerCase();

  const steps: Array<{
    key: string;
    label: string;
    done: boolean;
    active: boolean;
    icon: React.ReactNode;
  }> = [
    {
      key: "pending",
      label: "Pending",
      done: s !== "pending" && s !== "confirmed" && s !== "completed" && s !== "cancelled",
      active: s === "pending" || !s,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      done: s === "completed" || s === "cancelled" || s === "confirmed",
      active: s === "confirmed",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      key: "completed",
      label: "Completed",
      done: s === "completed",
      active: s === "completed",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      done: s === "cancelled",
      active: s === "cancelled",
      icon: <XCircle className="h-4 w-4" />,
    },
  ];

  const paymentLabel = paymentStatus
    ? paymentStatus
    : ps.includes("paid")
      ? "Paid"
      : ps.includes("pending")
        ? "Pending"
        : ps.includes("failed")
          ? "Failed"
          : "-";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Booking Timeline</p>
            <p className="mt-1 text-sm text-slate-600">Track the journey of your ride.</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-600">Payment</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{paymentLabel}</p>
          </div>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((st, idx) => (
          <li key={st.key} className="flex items-start gap-3">
            <div
              className={
                st.active
                  ? "mt-0.5 rounded-full bg-[#2563EB]/10 p-2 text-[#2563EB]"
                  : st.done
                    ? "mt-0.5 rounded-full bg-green-50 p-2 text-[#16A34A]"
                    : "mt-0.5 rounded-full bg-slate-100 p-2 text-slate-400"
              }
            >
              {st.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{idx + 1}. {st.label}</p>
              <p className="mt-1 text-xs text-slate-600">
                {st.active
                  ? "In progress"
                  : st.done
                    ? "Completed"
                    : "Not reached yet"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

