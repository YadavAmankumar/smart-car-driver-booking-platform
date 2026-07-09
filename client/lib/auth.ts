"use client";

import { api } from "@/lib/api";

export type LoginPayload = { email: string; password: string };

export async function loginAndPersist({
  role,
  values,
}: {
  role: "customer" | "driver" | "admin";
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

  if (token && user && backendRole) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", backendRole);
  }

  return { token, user, backendRole, expectedRole: role };
}

