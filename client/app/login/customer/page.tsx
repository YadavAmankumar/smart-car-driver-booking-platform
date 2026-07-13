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

        if (backendRole !== "customer") {
          // Never log in mismatched roles.
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          router.replace("/login/customer");
          return;
        }

        router.replace("/dashboard/customer");
      }}
    />
  );
}

