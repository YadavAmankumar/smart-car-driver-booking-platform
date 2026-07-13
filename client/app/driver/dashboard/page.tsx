"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { getCustomerProfile } from "@/lib/api";

import type { ReactNode } from "react";
import Link from "next/link";

function DriverSidebar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const items: Array<{ label: string; href?: string; onClick?: () => void }> = [
    { label: "Dashboard", href: "/driver/dashboard" },
    { label: "Bookings", href: "/driver/dashboard" },
    { label: "Cars", href: "/driver/dashboard" },
    { label: "Drivers", href: "/driver/dashboard" },
    { label: "Customers", href: "/driver/dashboard" },
    { label: "Payments", href: "/driver/dashboard" },
    { label: "Analytics", href: "/driver/dashboard" },
    { label: "Settings", href: "/driver/dashboard" },
    { label: "Logout", onClick: onLogout },
  ];

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur md:block">
      <div className="flex h-full flex-col px-5 py-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              DR
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Driver</p>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-2" aria-label="Driver sidebar">
          {items.map((it) => {
            const base = "rounded-lg px-3 py-2 text-sm font-semibold transition";
            const common = it.href
              ? `${base} bg-slate-900 text-white shadow-sm`
              : `${base} text-slate-700 hover:bg-slate-50`;

            if (it.href) {
              return (
                <Link key={it.label} href={it.href} className={common}>
                  {it.label}
                </Link>
              );
            }

            return (
              <button
                key={it.label}
                type="button"
                onClick={it.onClick}
                className={`${base} text-left text-slate-700 hover:bg-slate-50`}
              >
                {it.label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function DriverShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr] md:gap-8">
          <DriverSidebar
            onLogout={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("role");
              window.location.href = "/";
            }}
          />

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const res = await getCustomerProfile();
        const role = res?.user?.role;

        if (!mounted) return;

        if (role !== "driver") {
          if (role === "admin") router.replace("/admin/dashboard");
          else router.replace("/dashboard");
          return;
        }
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

  return (
    <DriverShell>
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading driver dashboard…
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Driver Dashboard</p>
              <p className="text-xs text-slate-600">Your trips, earnings, and tools.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Dashboard</p>
              <p className="mt-2 text-xs text-slate-600">Driver modules will render here.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Bookings</p>
              <p className="mt-2 text-xs text-slate-600">Driver bookings tools will render here.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Settings</p>
              <p className="mt-2 text-xs text-slate-600">Driver settings tools will render here.</p>
            </div>
          </div>
        </div>
      )}
    </DriverShell>
  );
}

