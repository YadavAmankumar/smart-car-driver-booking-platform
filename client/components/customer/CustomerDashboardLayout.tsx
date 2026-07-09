"use client";

import type { ReactNode } from "react";
import CustomerSidebar from "./CustomerSidebar";

export default function CustomerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr] md:gap-8">
          <CustomerSidebar
            onLogout={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("role");
              window.location.href = "/";
            }}
          />

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}

