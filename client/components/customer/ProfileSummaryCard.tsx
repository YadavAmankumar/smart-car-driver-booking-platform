"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import Link from "next/link";

export default function ProfileSummaryCard({
  name,
  email,
  phone,
  role,
}: {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}) {
  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-950">Profile Summary</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Your account details at a glance.</p>
          </div>
          <Link
            href="/profile"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Edit Profile
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Name</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {name || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {email || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {phone || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Role</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {role || "customer"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

