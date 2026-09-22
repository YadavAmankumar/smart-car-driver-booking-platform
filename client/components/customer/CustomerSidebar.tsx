"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
        setUserName(user.name.trim());
      }
    } catch {
      // Keep the fallback name if stored user data is invalid.
    }
  }, []);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CU";

  const items: Array<{ label: string; href?: string; onClick?: () => void }> = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "My Bookings", href: "/bookings" },
    { label: "Profile", href: "/profile" },
    { label: "Logout", onClick: onLogout },
  ];

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur md:block">
      <div className="flex h-full flex-col px-5 py-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {userName}
              </p>
              <p className="text-xs text-slate-500">Passenger</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-2" aria-label="Customer sidebar">
          {items.map((it) => {
            const active = it.href ? pathname === it.href : false;

            const base =
              "rounded-lg px-3 py-2 text-sm font-semibold transition";

            const className = active
              ? `${base} bg-slate-900 text-white shadow-sm`
              : `${base} text-slate-700 hover:bg-slate-50`;

            if (it.href) {
              return (
                <Link key={it.label} href={it.href} className={className}>
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

