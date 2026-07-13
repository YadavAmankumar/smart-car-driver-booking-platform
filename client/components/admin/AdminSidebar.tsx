"use client";

import Link from "next/link";

function ComingSoonItem({ label }: { label: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400"
      aria-disabled="true"
    >
      {label} (Coming Soon)
    </div>
  );
}

export default function AdminSidebar() {
  // Backend endpoints exist for Dashboard/Bookings/Cars/Drivers/Pricing/Payments.
  // Customers/Analytics/Settings are currently not wired; keep visible with Coming Soon.
  const items: Array<
    | { label: string; href: string }
    | { label: string; comingSoon: true }
  > = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Bookings", href: "/admin/bookings" },
    { label: "Cars", href: "/admin/cars" },
    { label: "Drivers", href: "/admin/drivers" },
    { label: "Customers", comingSoon: true },
    { label: "Payments", href: "/admin/payments" },
    { label: "Pricing", href: "/admin/pricing" },
    { label: "Analytics", comingSoon: true },
    { label: "Settings", comingSoon: true },
  ];

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur md:block">
      <div className="flex h-full flex-col px-5 py-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              AD
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">Navigation</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-2" aria-label="Admin sidebar">
          {items.map((it) => {
            if ("comingSoon" in it) {
              return <ComingSoonItem key={it.label} label={it.label} />;
            }

            return (
              <Link
                key={it.label}
                href={it.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {it.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("role");
              window.location.href = "/";
            }}
            className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
}

