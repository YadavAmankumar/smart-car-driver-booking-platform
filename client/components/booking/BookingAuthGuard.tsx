"use client";

import { useEffect, useMemo, useState } from "react";

import { protectBookingPage } from "@/lib/bookingAuth";

export default function BookingAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean>(false);

  const guard = useMemo(() => protectBookingPage, []);

  useEffect(() => {
    const res = guard();
    // Redirect happens inside guard().
    // Keep state update out of the same synchronous tick to satisfy eslint.
    queueMicrotask(() => setAllowed(res.allowed));
  }, [guard]);


  if (!allowed) return null;
  return <>{children}</>;
}

