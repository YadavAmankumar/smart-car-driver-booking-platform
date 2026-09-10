"use client";

export type SessionRole = "customer" | "driver" | "admin";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role: SessionRole;
};

const validRoles = new Set<SessionRole>(["customer", "driver", "admin"]);

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && validRoles.has(value as SessionRole);
}

export function persistSession(token: string, user: SessionUser) {
  if (typeof window === "undefined" || !token || !isSessionRole(user.role)) return;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  // This is a navigation hint only; API authorization is always server-side.
  localStorage.setItem("role", user.role);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  return token && token.trim() ? token : null;
}
