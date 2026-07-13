"use client";

import Link from "next/link";

export default function AdminNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-slate-900"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            AD
          </span>
          <span className="hidden sm:inline">Admin Panel</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("role");
              window.location.href = "/";
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

