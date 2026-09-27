"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function CustomerSidebar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Customer");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser) as { name?: string };

      if (user.name?.trim()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserName(user.name.trim());
      }
    } catch {
      // Keep the fallback name if stored user data is invalid.
    }
  }, []);

  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CU";

  const items = [
    {
      label: "Dashboard",
      href: "/dashboard/customer",
      icon: LayoutDashboard,
    },
    {
      label: "My Bookings",
      href: "/bookings",
      icon: CalendarDays,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: UserCircle,
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-extrabold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">Customer account</p>
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="Customer mobile navigation">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        </nav>
      </div>

      <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 md:block">
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-slate-900 shadow-sm">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{userName}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-300">
                Customer account
              </p>
            </div>
          </div>
        </div>

        <nav
          className="mt-5 flex flex-1 flex-col"
          aria-label="Customer sidebar"
        >
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Menu
          </p>

          <div className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              const className = active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${className}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-rose-100 group-hover:text-rose-700">
                <LogOut className="h-4 w-4" strokeWidth={2} />
              </span>

              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
      </aside>
    </>
  );
}
