"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomerProfile } from "@/lib/api";

type Role = "customer" | "driver" | "admin";

export default function DashboardIndexPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const res = await getCustomerProfile();
        const role = res?.user?.role as Role | undefined;

        if (!mounted) return;

        if (role === "customer") {
          router.replace("/dashboard/customer");
          return;
        }

        if (role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }

        if (role === "driver") {
          router.replace("/driver/dashboard");
          return;
        }

        // Unknown role -> go to customer login
        router.replace("/login/customer");
      } catch {
        if (!mounted) return;
        toast.error("Please login to access your dashboard");
        router.replace("/login/customer");
      } finally {
        if (mounted) setReady(true);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return null;
  return null;
}


