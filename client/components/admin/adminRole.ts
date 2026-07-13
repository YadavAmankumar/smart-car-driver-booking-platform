export type StoredRole = "customer" | "driver" | "admin";

// IMPORTANT: This helper must be used only in client components.
// Server components can't access localStorage, so it returns null there.
export function getStoredRoleOrNull(): StoredRole | null {
  if (typeof window === "undefined") return null;
  const rawRole = localStorage.getItem("role");
  if (!rawRole) return null;

  const role = rawRole as StoredRole;
  if (role === "customer" || role === "driver" || role === "admin") return role;
  return null;
}


