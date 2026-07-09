"use client";

import { Card, CardContent } from "@/components/ui/primitives";
import WishlistStatCard from "./WishlistStatCard";

export default function BookingStatisticsBar({
  total,
  completed,
  pending,
  cancelled,
}: {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-bold text-slate-900">Booking Statistics</h2>
        <p className="mt-2 text-sm text-slate-600">Quick breakdown of your ride history.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <WishlistStatCard label="Total Bookings" value={total} tone="neutral" />
          </div>
          <div>
            <WishlistStatCard label="Completed" value={completed} tone="green" />
          </div>
          <div>
            <WishlistStatCard label="Pending" value={pending} tone="amber" />
          </div>
          <div>
            <WishlistStatCard label="Cancelled" value={cancelled} tone="red" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

