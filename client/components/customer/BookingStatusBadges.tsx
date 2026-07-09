"use client";

import { Badge } from "@/components/ui/primitives";

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled" | string;

function toTone(status: BookingStatus): "neutral" | "blue" | "green" | "amber" | "red" {
  const s = (status || "").toLowerCase();
  if (s.includes("pending")) return "amber";
  if (s.includes("confirmed")) return "blue";
  if (s.includes("complete")) return "green";
  if (s.includes("cancel")) return "red";
  return "neutral";
}

export default function BookingStatusBadges({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const label = status || "Pending";
  const tone = toTone(status);

  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

