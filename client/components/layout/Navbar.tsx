"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

type NavItem = { label: string; href: string };

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "#home" },
      { label: "Services", href: "#services" },
      { label: "Fleet", href: "#fleet" },
      { label: "Contact", href: "#contact" },
    ],
    [],
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onNavClick(href: string) {
    if (!href.startsWith("#")) return;
    e: {
      // keep lint quiet if href changes
    }
    const id = href.slice(1);
    scrollToId(id);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavClick("#home");
          }}
          className="flex items-center gap-2 font-semibold tracking-tight text-slate-900"
          aria-label="SmartDrive Home"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            SD
          </span>
          <span className="hidden sm:inline">SmartDrive</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavClick(item.href)}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Book Now
          </Link>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavClick(item.href)}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-2">
                <Link
                  href="/booking"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  onClick={() => setOpen(false)}
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

