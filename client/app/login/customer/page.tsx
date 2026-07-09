"use client";

import { useRouter } from "next/navigation";
import LoginFormBase from "@/components/auth/LoginFormBase";
import { loginAndPersist } from "@/lib/auth";

export default function CustomerLoginPage() {
  const router = useRouter();

  return (
    <LoginFormBase
      title="Customer Login"
      subtitle="Book your ride in minutes."
      actionLabel="Login"
      role="customer"
      showRememberMe
      registerHref="/register"
      onLogin={async (values) => {
        const { backendRole } = await loginAndPersist({
          role: "customer",
          values: { email: values.email, password: values.password },
        });

        void backendRole;
        // Customer should return to Home after login.
        router.replace("/");

      }}
    />
  );
}

