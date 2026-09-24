"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/primitives";
import { getAdminPaymentRevenue, type AdminPaymentRevenue } from "@/lib/api";

function money(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof amount === "number" ? amount : 0);
}

export default function AdminPaymentsPage() {
  const [revenue, setRevenue] = useState<AdminPaymentRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadRevenue() {
    setLoading(true);

    try {
      const res = await getAdminPaymentRevenue();
      setRevenue(res.data);
    } catch {
      toast.error("Failed to load payment summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadRevenue());
  }, []);

  const cards = [
    {
      label: "Total Received",
      value: revenue?.totalRevenue,
    },
    {
      label: "Today",
      value: revenue?.todayRevenue,
    },
    {
      label: "This Month",
      value: revenue?.monthlyRevenue,
    },
    {
      label: "Cash",
      value: revenue?.cashRevenue,
    },
    {
      label: "UPI",
      value: revenue?.upiRevenue,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Payment summary from all drivers.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            Loading payment summary...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-600">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {money(card.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
