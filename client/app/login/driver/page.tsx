"use client";

import { useRouter } from "next/navigation";
import LoginFormBase from "@/components/auth/LoginFormBase";
import { loginAndPersist } from "@/lib/auth";

export default function DriverLoginPage() {
  const router = useRouter();

  return (
    <LoginFormBase
      title="Driver Login"
      subtitle="Manage your trips and earn with every ride."
      actionLabel="Login"
      role="driver"
      onLogin={async (values) => {
        const { backendRole } = await loginAndPersist({
          role: "driver",
          values: { email: values.email, password: values.password },
        });

        if (backendRole !== "driver") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          router.replace("/login/driver");
          return;
        }

        router.replace("/driver/dashboard");
      }}
    />
  );
}

