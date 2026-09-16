"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

const navItems = [
  { label: "Dashboard", href: "/driver/dashboard" },
  { label: "My Profile", href: "/driver/profile" },
  { label: "My Bookings", href: "/driver/bookings" },
  { label: "Assigned Car", href: "/driver/car" },
  { label: "Trip Details", href: "/driver/trips" },
  { label: "Payment/Cash Collection", href: "/driver/payments" },
  { label: "Earnings/History", href: "/driver/earnings" },
];

export default function DriverLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.replace("/login/driver");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:block">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <p className="text-lg font-bold text-slate-900">
              Driver Panel
            </p>
            <p className="text-xs text-slate-500">
              Driver workspace
            </p>
          </div>

          <nav
            className="flex flex-col gap-1"
            aria-label="Driver navigation"
          >
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Logout
            </button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          {children}
        </section>
      </div>
    </main>
  );
}
