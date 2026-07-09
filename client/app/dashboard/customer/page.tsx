"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import CustomerWelcomeCard from "@/components/customer/CustomerWelcomeCard";
import CustomerQuickActions from "@/components/customer/CustomerQuickActions";
import RecentBookingsList from "@/components/customer/RecentBookingsList";
import BookingStatisticsBar from "@/components/customer/BookingStatisticsBar";
import ProfileSummaryCard from "@/components/customer/ProfileSummaryCard";
import { getCustomerBookings, getCustomerProfile } from "@/lib/api";

type Booking = {
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

export default function CustomerDashboardPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>("customer");
  const [bookings, setBookings] = useState<Booking[]>([]);
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
        setRole(user?.role || "customer");

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <CustomerWelcomeCard
            name={name}
            greeting={greeting}
            totalBookings={stats.total}
          />
          <div className="space-y-6">
            <BookingStatisticsBar
              total={stats.total}
              completed={stats.completed}
              pending={stats.pending}
              cancelled={stats.cancelled}
            />
          </div>
        </div>

        <CustomerQuickActions />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <RecentBookingsList bookings={bookings} />
          <ProfileSummaryCard name={name} email={email} phone={phone} role={role} />
        </div>
      </div>
    </CustomerDashboardLayout>
  );
}

