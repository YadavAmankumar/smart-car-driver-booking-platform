"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, User, X, LayoutDashboard, CalendarDays, UserCircle } from "lucide-react";

import { siteConfig } from "@/lib/siteConfig";
import { redirectToBookingOrLogin } from "@/lib/bookingAuth";

type NavItem = { label: string; href: string };

type Role = "customer" | "driver" | "admin";

type StoredUser = {
  role?: Role | string;
  name?: string;
  email?: string;
  phone?: string;
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;

  const rawRole = localStorage.getItem("role");
  if (!rawRole) return null;

  const role = rawRole as Role;

  if (role === "customer" || role === "driver" || role === "admin") {
    return role;
  }

  return null;
}

function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(max-width: 767px)").matches;
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function getRoleLabel(role: Role | null) {
  if (role === "admin") return "Administrator";
  if (role === "driver") return "Driver";
  if (role === "customer") return "Customer";

  return "Account";
}

export default function Navbar() {
  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "#home" },
      { label: "Services", href: "#services" },
      { label: "Car", href: "#fleet" },
      { label: "Contact", href: "#contact" },
    ],
    [],
  );

  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [authRole, setAuthRole] = useState<Role | null>(null);
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const loginMenuCloseTimer = useRef<number | null>(null);
  const loginTriggerRef = useRef<HTMLDivElement | null>(null);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const userTriggerRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLoginMenuOpen(false);
        setUserMenuOpen(false);

        if (loginMenuCloseTimer.current) {
          window.clearTimeout(loginMenuCloseTimer.current);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      const role = getStoredRole();

      if (!role) {
        setAuthRole(null);
        setAuthUser(null);
        return;
      }

      setAuthRole(role);
      setAuthUser(getStoredUser());
    });
  }, []);

  useEffect(() => {
    function onDocPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as HTMLElement | null;

      if (!target) return;

      if (loginMenuOpen) {
        const trigger = loginTriggerRef.current;
        const menu = loginMenuRef.current;

        if (!trigger?.contains(target) && !menu?.contains(target)) {
          setLoginMenuOpen(false);
        }
      }

      if (userMenuOpen) {
        const trigger = userTriggerRef.current;
        const menu = userMenuRef.current;

        if (!trigger?.contains(target) && !menu?.contains(target)) {
          setUserMenuOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("touchstart", onDocPointerDown);

    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("touchstart", onDocPointerDown);
    };
  }, [loginMenuOpen, userMenuOpen]);

  function onNavClick(href: string) {
    if (!href.startsWith("#")) return;

    const item = navItems.find((navItem) => navItem.href === href);

    if (item) {
      setActiveNav(item.label);
    }

    scrollToId(href.slice(1));
    setOpenMobileMenu(false);
  }

  function closeLoginMenuSoon() {
    if (loginMenuCloseTimer.current) {
      window.clearTimeout(loginMenuCloseTimer.current);
    }

    loginMenuCloseTimer.current = window.setTimeout(() => {
      setLoginMenuOpen(false);
      loginMenuCloseTimer.current = null;
    }, 180);
  }

  function openLoginMenu() {
    if (loginMenuCloseTimer.current) {
      window.clearTimeout(loginMenuCloseTimer.current);
    }

    loginMenuCloseTimer.current = null;
    setLoginMenuOpen(true);
  }

  function onPrimaryAction(e: React.MouseEvent) {
    e.preventDefault();

    if (authRole === "admin") {
      window.location.href = "/admin/dashboard";
      return;
    }

    if (authRole === "driver") {
      window.location.href = "/driver/dashboard";
      return;
    }

    redirectToBookingOrLogin();
  }

  function getPrimaryActionLabel() {
    if (authRole === "admin") return "Admin Dashboard";
    if (authRole === "driver") return "Driver Dashboard";
    return "Book Now";
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setAuthRole(null);
    setAuthUser(null);
    setLoginMenuOpen(false);
    setUserMenuOpen(false);
    setOpenMobileMenu(false);

    window.location.href = "/";
  }

  const showLoginDropdown = !authRole;
  const displayName = authUser?.name ?? authUser?.email ?? "Account";
  const initials = getInitials(authUser?.name);
  const roleLabel = getRoleLabel(authRole);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavClick("#home");
          }}
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={`${siteConfig.companyName} Home`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-slate-950/10 transition-transform duration-200 group-hover:-translate-y-0.5">
            SD
          </span>

          <div className="hidden sm:block">
            <span className="block text-[15px] font-extrabold tracking-tight text-slate-950">
              {siteConfig.companyName}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Smart mobility
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavClick(item.href)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                activeNav === item.label
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-950 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {showLoginDropdown ? (
            <div
              ref={loginTriggerRef}
              className="relative"
              onMouseEnter={() => {
                if (!isMobileViewport()) openLoginMenu();
              }}
              onMouseLeave={() => {
                if (!isMobileViewport()) closeLoginMenuSoon();
              }}
            >
              <button
                type="button"
                onClick={() => setLoginMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                aria-haspopup="menu"
                aria-expanded={loginMenuOpen}
              >
                Login
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    loginMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                ref={loginMenuRef}
                role="menu"
                className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 transition-all duration-150 ${
                  loginMenuOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="px-3 pb-2 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sign in as
                  </p>
                </div>

                {[
                  ["Customer", "/login/customer"],
                  ["Driver", "/login/driver"],
                  ["Admin", "/login/admin"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    role="menuitem"
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <User className="mr-2.5 h-4 w-4 text-slate-400" />
                    {label} Login
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div
              ref={userTriggerRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="group inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white shadow-sm">
                  {initials}
                </span>

                <span className="hidden lg:block text-left">
                  <span className="block max-w-[130px] truncate text-xs font-bold text-slate-900">
                    {displayName}
                  </span>
                  <span className="block text-[10px] font-medium text-slate-400">
                    {roleLabel}
                  </span>
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                ref={userMenuRef}
                role="menu"
                className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 transition-all duration-150 ${
                  userMenuOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="mb-1 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {displayName}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 py-1">
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-400" />
                    My Dashboard
                  </Link>

                  <Link
                    href="/bookings"
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    My Bookings
                  </Link>

                  <Link
                    href="/profile"
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onPrimaryAction}
            className="group inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-950/20 active:translate-y-0"
          >
            {getPrimaryActionLabel()}

            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={openMobileMenu ? "Close menu" : "Open menu"}
          onClick={() => setOpenMobileMenu((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
        >
          {openMobileMenu ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {openMobileMenu ? (
        <div className="border-t border-slate-200 bg-white shadow-xl md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavClick(item.href)}
                  className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {showLoginDropdown ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sign in
                </p>

                <div className="space-y-1">
                  <Link
                    href="/login/customer"
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                    onClick={() => setOpenMobileMenu(false)}
                  >
                    Customer Login
                  </Link>

                  <Link
                    href="/login/driver"
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                    onClick={() => setOpenMobileMenu(false)}
                  >
                    Driver Login
                  </Link>

                  <Link
                    href="/login/admin"
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                    onClick={() => setOpenMobileMenu(false)}
                  >
                    Admin Login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <div className="mb-1 flex items-center gap-3 rounded-xl bg-white p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500">{roleLabel}</p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                  onClick={() => setOpenMobileMenu(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  My Dashboard
                </Link>

                <Link
                  href="/bookings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                  onClick={() => setOpenMobileMenu(false)}
                >
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  My Bookings
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                  onClick={() => setOpenMobileMenu(false)}
                >
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  Profile
                </Link>

                <div className="my-1 border-t border-slate-200" />

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onPrimaryAction}
              className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-900"
            >
              Book Now
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10H16M16 10L11 5M16 10L11 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
