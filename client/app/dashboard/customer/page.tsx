"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import CustomerWelcomeCard from "@/components/customer/CustomerWelcomeCard";
import CustomerQuickActions from "@/components/customer/CustomerQuickActions";
import RecentBookingsList from "@/components/customer/RecentBookingsList";
import ProfileSummaryCard from "@/components/customer/ProfileSummaryCard";

type CustomerBooking = {
  _id?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  bookingStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  serviceType?: string;
};

// NOTE: keep this page self-contained; no duplicate global Booking types.


function RecentBookingsListWithPremiumEmptyState({
  bookings,
}: {
  bookings: CustomerBooking[];
}) {

  if (bookings.length > 0) {

    return <RecentBookingsList bookings={bookings} />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
            <p className="mt-2 text-sm text-slate-600">
              No bookings yet
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            🚀
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-b from-slate-50 to-white p-5">
          <p className="text-sm font-semibold text-slate-900">
            Book your first ride
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Request a smart car driver and start your next trip.
          </p>

          <div className="mt-5">
            <a
              href="/booking"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
            >
              Book a Ride
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}



import { getCustomerBookings, getCustomerProfile } from "@/lib/api";

export default function CustomerDashboardPage() {


  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [profileRes, bookingsRes] = await Promise.all([
          getCustomerProfile(),
          getCustomerBookings(),
        ]);

        if (!mounted) return;

        const user = profileRes?.user;
        setName(user?.name || "");
        setEmail(user?.email || "");
        setPhone(user?.phone || "");
        setRole(user?.role || "");

        const data = Array.isArray(bookingsRes?.data)
          ? bookingsRes.data
          : [];
        setBookings(data);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter((b) =>
      (b.bookingStatus || "").toLowerCase().includes("complete")
    ).length;
    const pending = bookings.filter((b) =>
      (b.bookingStatus || "").toLowerCase().includes("pending")
    ).length;
    const cancelled = bookings.filter((b) =>
      (b.bookingStatus || "").toLowerCase().includes("cancel")
    ).length;

    return {
      total: bookings.length,
      completed,
      pending,
      cancelled,
    };
  }, [bookings]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);


  return (
    <CustomerDashboardLayout>
      <div className="space-y-6">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading dashboard…
          </div>
        ) : null}

        {/* 1. Welcome Header */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
          <CustomerWelcomeCard
            name={name}
            greeting={greeting}
            totalBookings={stats.total}
          />

          {/* 2. Quick Statistics */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick Statistics</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Your ride history at a glance.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Updated just now
                </div>
              </div>

              {/* Premium stat cards (use existing computed stats; no new API) */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <p className="text-[11px] font-semibold text-slate-500">Upcoming Bookings</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{stats.pending}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <p className="text-[11px] font-semibold text-emerald-600">Completed Trips</p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-700">{stats.completed}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <p className="text-[11px] font-semibold text-rose-600">Cancelled Trips</p>
                  <p className="mt-1 text-lg font-extrabold text-rose-700">{stats.cancelled}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <p className="text-[11px] font-semibold text-indigo-600">Total Spent</p>
                  <p className="mt-1 text-lg font-extrabold text-indigo-700">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Actions */}
        <CustomerQuickActions />

        {/* 4. Recent Bookings + 5. Profile Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <RecentBookingsListWithPremiumEmptyState
              bookings={bookings}
            />
          </div>
          <ProfileSummaryCard name={name} email={email} phone={phone} role={role} />
        </div>

      </div>
    </CustomerDashboardLayout>
  );
}

