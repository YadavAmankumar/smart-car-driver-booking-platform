"use client";

export type StoredRole = "customer" | "driver" | "admin";


function getStoredRole(): StoredRole | null {
  if (typeof window === "undefined") return null;
  const rawRole = localStorage.getItem("role");
  if (!rawRole) return null;
  const role = rawRole as StoredRole;
  if (role === "customer" || role === "driver" || role === "admin") return role;
  return null;
}

/**
 * Shared auth+navigation flow for every "Book Now" CTA.
 * Matches the logic already used in Navbar.
 */
export function redirectToBookingOrLogin() {
  const role = getStoredRole();

  // Navbar behavior: if no role -> go to customer login.
  if (!role) {
    window.location.href = "/login/customer";
    return;
  }

  if (role === "customer") {
    window.location.href = "/booking";
    return;
  }

  if (role === "driver") {
    alert("Drivers cannot create bookings.");
    return;
  }

  alert("Admins cannot create bookings.");
}

/**
 * Used by the /booking page to protect direct URL access.
 */
export function getBookingAccessRole(): StoredRole | null {
  return getStoredRole();
}

/**
 * Redirect guard for /booking page.
 */
export function protectBookingPage(): {
  allowed: boolean;
} {
  const role = getBookingAccessRole();

  if (!role) {
    window.location.href = "/login/customer";
    return { allowed: false };
  }

  if (role === "customer") {
    return { allowed: true };
  }

  // Keep behavior consistent with Navbar: block drivers/admins.
  if (role === "driver") {
    alert("Drivers cannot create bookings.");
    return { allowed: false };
  }

  alert("Admins cannot create bookings.");
  return { allowed: false };
}

