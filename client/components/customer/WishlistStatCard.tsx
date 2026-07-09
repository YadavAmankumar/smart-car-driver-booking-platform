"use client";

import { Card, CardContent } from "@/components/ui/primitives";

export default function WishlistStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  const toneStyles: Record<typeof tone, string> = {
    neutral: "border-slate-200 bg-white",
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  };

  return (
    <Card className={`border ${toneStyles[tone]}`}>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}


