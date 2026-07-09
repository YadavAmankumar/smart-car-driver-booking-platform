"use client";

import Link from "next/link";
import { Badge, Button } from "@/components/ui/primitives";
import type { ReactNode } from "react";

export default function RoleSelectCard({
  role,
  title,
  description,
  href,
  badgeTone,
  icon,
}: {
  role: "customer" | "driver" | "admin";
  title: string;
  description: ReactNode;
  href: string;
  badgeTone?: "neutral" | "blue" | "green" | "amber" | "red";
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
          </div>
          <p className="mt-2 text-sm text-[#64748B]">{description}</p>
        </div>
        <Badge tone={badgeTone ?? "blue"}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      </div>
      <div className="mt-5">
        <Button asChild className="w-full">
          <Link href={href}>Continue</Link>
        </Button>
      </div>
    </div>
  );
}

