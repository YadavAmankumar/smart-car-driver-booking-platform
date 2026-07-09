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
      <CardHeader className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
            <p className="mt-2 text-sm text-slate-600">Your account details at a glance.</p>
          </div>
          <Link
            href="/profile"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Edit Profile
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Name</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {name || "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Email</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {email || "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Phone</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {phone || "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Role</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {role || "customer"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

