"use client";

import { useRouter } from "next/navigation";
import LoginFormBase from "@/components/auth/LoginFormBase";
import { loginAndPersist } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <LoginFormBase
      title="Admin Login"
      subtitle="Secure access for fleet operations."
      actionLabel="Login"
      role="admin"
      onLogin={async (values) => {
        await loginAndPersist({
          role: "admin",
          values: { email: values.email, password: values.password },
        });
        router.replace("/dashboard");
      }}
    />
  );
}

