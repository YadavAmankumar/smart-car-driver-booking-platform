"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { getCustomerProfile } from "@/lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const res = await getCustomerProfile();
        const role = res?.user?.role;

        if (!mounted) return;

        if (role !== "admin") {
          if (role === "driver") router.replace("/driver/dashboard");
          else router.replace("/dashboard");
          return;
        }
      } catch {
        if (!mounted) return;
        toast.error("Please login to access your dashboard");
        router.replace("/login/admin");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="w-full px-6 py-6">
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading admin dashboard…
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <section>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Total Bookings" value="—" hint="All time" />
              <StatCard title="Active Trips" value="—" hint="In progress" />
              <StatCard title="Revenue" value="—" hint="This month" />
              <StatCard title="Drivers" value="—" hint="Available" />
              <StatCard title="Fleet" value="—" hint="Vehicles" />
              <StatCard title="Pending Payments" value="—" hint="Awaiting" accent />
            </div>
          </section>

          {/* Recent + Driver (side-by-side) */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recent Bookings</p>
                    <p className="mt-1 text-xs text-slate-600">Latest bookings from customers.</p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-bold text-slate-600">
                          <th className="px-4 py-3">Booking</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Vehicle</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        <PlaceholderRow />
                        <PlaceholderRow />
                        <PlaceholderRow />
                        <PlaceholderRow />
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Driver Status</p>
                  <p className="mt-1 text-xs text-slate-600">Availability & current workload.</p>
                </div>

                <div className="mt-4 space-y-3">
                  <StatusRow label="Available" value="—" tone="green" />
                  <StatusRow label="On Trip" value="—" tone="blue" />
                  <StatusRow label="Offline" value="—" tone="slate" />
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-700">Tip</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Prioritize dispatching to available drivers to reduce trip delays.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Fleet + Quick Actions (side-by-side) */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Fleet Status</p>
                  <p className="mt-1 text-xs text-slate-600">Vehicles readiness & utilization.</p>
                </div>

                <div className="mt-4 space-y-3">
                  <StatusRow label="Ready" value="—" tone="green" />
                  <StatusRow label="In Service" value="—" tone="amber" />
                  <StatusRow label="Maintenance" value="—" tone="red" />
                </div>

                <div className="mt-5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[62%] rounded-full bg-slate-900" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Utilization</span>
                    <span className="font-semibold text-slate-800">62%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
                  <p className="mt-1 text-xs text-slate-600">Shortcuts for common admin tasks.</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ActionButton title="Create Booking" subtitle="Add new trip" />
                  <ActionButton title="Manage Fleet" subtitle="Cars & maintenance" />
                  <ActionButton title="Driver Dispatch" subtitle="Assign available drivers" />
                  <ActionButton title="View Payments" subtitle="Review pending invoices" />
                </div>

                <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white">
                  <p className="text-xs font-semibold">Security</p>
                  <p className="mt-1 text-xs text-slate-200">
                    Session remains protected via existing auth logic.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        accent
          ? "border-slate-900/20"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-600">{title}</p>
          <p className={`mt-2 text-lg font-extrabold tracking-tight ${accent ? "text-slate-900" : "text-slate-900"}`}>
            {value}
          </p>
        </div>
        <div className={`mt-1 h-10 w-10 rounded-xl ${accent ? "bg-slate-900" : "bg-slate-100"} flex items-center justify-center`}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={accent ? "text-white" : "text-slate-800"}
          >
            <path
              d="M4 19V5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path
              d="M8 19V9" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path
              d="M12 19V12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path
              d="M16 19V7" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path
              d="M20 19V10" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">{hint}</p>
    </div>
  );
}

function PlaceholderRow() {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 text-sm font-semibold text-slate-800">—</td>
      <td className="px-4 py-3 text-sm text-slate-600">—</td>
      <td className="px-4 py-3 text-sm text-slate-600">—</td>
      <td className="px-4 py-3 text-sm text-slate-600">—</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Pending
        </span>
      </td>
    </tr>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "slate" | "amber" | "red";
}) {
  const toneMap: Record<typeof tone, string> = {
    green: "bg-green-50 text-green-800 ring-green-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
    slate: "bg-slate-50 text-slate-800 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-800 ring-red-200",
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${toneMap[tone]}`}
        >
          <span className="text-xs font-bold">{label.slice(0, 1)}</span>
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-600">Status summary</p>
        </div>
      </div>
      <p className="text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
      onClick={() => {
        // No routing/business logic changes. Intentionally a visual-only button.
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-800 transition group-hover:bg-slate-900 group-hover:text-white">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

