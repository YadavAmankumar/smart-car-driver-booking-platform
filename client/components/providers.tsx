"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            border: "1px solid #E2E8F0",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
            color: "#0F172A",
            fontSize: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
