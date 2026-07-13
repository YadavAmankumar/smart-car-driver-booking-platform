"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

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
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  const rawRole = localStorage.getItem("role");
  if (!rawRole) return null;
  const role = rawRole as Role;
  if (role === "customer" || role === "driver" || role === "admin") return role;
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

  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const [authRole, setAuthRole] = useState<Role | null>(null);
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);

  // Login dropdown state (desktop hover+click).
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const loginMenuCloseTimer = useRef<number | null>(null);
  const loginTriggerRef = useRef<HTMLDivElement | null>(null);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);

  // User dropdown (desktop).
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLoginMenuOpen(false);
        if (loginMenuCloseTimer.current) window.clearTimeout(loginMenuCloseTimer.current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

      // Login menu outside click
      if (loginMenuOpen) {
        const trigger = loginTriggerRef.current;
        const menu = loginMenuRef.current;
        if (!trigger?.contains(target) && !menu?.contains(target)) {
          setLoginMenuOpen(false);
        }
      }

      // User menu outside click
      if (userMenuOpen) {
        const trigger = loginTriggerRef.current;
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
    const id = href.slice(1);
    scrollToId(id);
    setOpenMobileMenu(false);
  }

  function closeLoginMenuSoon() {
    if (loginMenuCloseTimer.current) window.clearTimeout(loginMenuCloseTimer.current);
    loginMenuCloseTimer.current = window.setTimeout(() => {
      setLoginMenuOpen(false);
      loginMenuCloseTimer.current = null;
    }, 180);
  }

  function openLoginMenu() {
    if (loginMenuCloseTimer.current) window.clearTimeout(loginMenuCloseTimer.current);
    loginMenuCloseTimer.current = null;
    setLoginMenuOpen(true);
  }

  function onBookNowClick(e: React.MouseEvent) {
    e.preventDefault();
    redirectToBookingOrLogin();
  }



  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setAuthRole(null);
    setAuthUser(null);
    setLoginMenuOpen(false);
    window.location.href = "/";
  }

  const showLoginDropdown = !authRole;

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
          aria-label={`${siteConfig.companyName} Home`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            SD
          </span>
          <span className="hidden sm:inline">{siteConfig.companyName}</span>
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
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={loginMenuOpen}
              >
                Login <span aria-hidden="true">▼</span>
              </button>

              <div
                ref={loginMenuRef}
                role="menu"
                className={`absolute right-0 top-full mt-0 w-52 origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-lg transition-all duration-150 ${
                  loginMenuOpen
                    ? "pointer-events-auto opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 -translate-y-1"
                }`}
                onMouseEnter={() => {
                  if (!isMobileViewport()) openLoginMenu();
                }}
                onMouseLeave={() => {
                  if (!isMobileViewport()) closeLoginMenuSoon();
                }}
              >
                <div className="flex flex-col">
                  <Link
                    href="/login/customer"
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    Customer Login
                  </Link>
                  <Link
                    href="/login/driver"
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    Driver Login
                  </Link>
                  <Link
                    href="/login/admin"
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={loginTriggerRef}
              className="relative"
              onMouseLeave={() => {
                if (!isMobileViewport()) {
                  setUserMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span aria-hidden="true">👤</span>
                <span>{authUser?.name ?? authUser?.email ?? authRole?.toString()}</span>
                <span aria-hidden="true">▼</span>
              </button>

              <div
                ref={userMenuRef}
                role="menu"
                className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-lg transition-all duration-150 ${
                  userMenuOpen
                    ? "pointer-events-auto opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 -translate-y-1"
                }`}
              >
                <div className="flex flex-col">
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                  >
                    My Dashboard
                  </Link>
                    <Link
                    href="/bookings"

                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    role="menuitem"
                    className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onBookNowClick}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Book Now
          </button>


        </div>

        <div className="md:hidden">
          <button
            type="button"
            aria-label={openMobileMenu ? "Close menu" : "Open menu"}
            onClick={() => setOpenMobileMenu((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white"
          >
            {openMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {openMobileMenu ? (
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

              {showLoginDropdown ? (
                <div className="pt-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="px-2 pb-1 text-xs font-semibold text-slate-500">Login</p>
                    <div className="flex flex-col">
                      <Link
                        href="/login/customer"
                        className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenMobileMenu(false)}
                      >
                        Customer Login
                      </Link>
                      <Link
                        href="/login/driver"
                        className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenMobileMenu(false)}
                      >
                        Driver Login
                      </Link>
                      <Link
                        href="/login/admin"
                        className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenMobileMenu(false)}
                      >
                        Admin Login
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="px-2 pb-1 text-xs font-semibold text-slate-500">Account</p>
                    <div className="flex flex-col">
                      <>
                        <Link
                          href="/dashboard"
                          className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpenMobileMenu(false)}
                        >
                          My Dashboard
                        </Link>
                    <Link
                    href="/bookings"
                          className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpenMobileMenu(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/profile"
                          className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpenMobileMenu(false)}
                        >
                          Profile
                        </Link>
                      </>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMobileMenu(false);
                          logout();
                        }}
                        className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBookNowClick}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}


