"use client";

import { api } from "@/lib/api";
import { clearSession, isSessionRole, persistSession, type SessionRole } from "@/lib/session";

export type LoginPayload = { email: string; password: string };

export async function loginAndPersist({
  role,
  values,
}: {
  role: SessionRole;
  values: LoginPayload;
}) {
  type BackendLoginResponse = {
    token?: string;
    user?: {
      role?: string;
      // backend also returns name/email/phone; we only need role.
    };
  };

  const res = await api.post<BackendLoginResponse>("/auth/login", {
    email: values.email,
    password: values.password,
  });

  const token: string | undefined = res.data?.token;
  const user = res.data?.user;
  const backendRole: string | undefined = user?.role;

  if (!token || !user || !isSessionRole(backendRole) || backendRole !== role) {
    clearSession();
    return { token: undefined, user: undefined, backendRole: undefined, expectedRole: role };
  }

  persistSession(token, { ...user, role: backendRole });
  return { token, user, backendRole, expectedRole: role };
}
