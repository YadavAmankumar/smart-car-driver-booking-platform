"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import { getCustomerBookings, getCustomerProfile } from "@/lib/api";

type CustomerBooking = {
  _id?: string;
  bookingNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  bookingStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  serviceType?: string;
  tripType?: string;
  driver?: {
    driverName?: string;
    phoneNumber?: string;
    experience?: number;
    imageUrl?: string | null;
  } | null;
  car?: {
    carName?: string;
    carNumber?: string;
    carModel?: string;
    imageUrl?: string | null;
  } | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  statusHistory?: Array<{
    from?: string;
    to?: string;
    changedAt?: string;
    reason?: string;
  }>;
};

const ACTIVE_STATUSES = ["Pending", "Confirmed", "Ongoing"];

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status?: string) {
  switch (status) {
    case "Pending":
      return "Booking Requested";
    case "Confirmed":
      return "Booking Confirmed";
    case "Ongoing":
      return "Trip Ongoing";
    case "Completed":
      return "Trip Completed";
    case "Cancelled":
      return "Booking Cancelled";
    default:
      return "Booking Requested";
  }
}

function statusStep(
  status?: string,
  serviceType?: string,
  hasDriver?: boolean,
  hasCar?: boolean,
) {
  const assignmentComplete =
    serviceType === "Driver Only"
      ? Boolean(hasDriver)
      : Boolean(hasDriver && hasCar);

  if (status === "Completed") return 5;
  if (status === "Ongoing") return 4;
  if (status === "Confirmed") return 3;
  if (assignmentComplete) return 2;

  return 1;
}

function statusClasses(status?: string) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Confirmed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Ongoing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getInitials(name?: string) {
  const value = name?.trim();

  if (!value) {
    return "D";
  }

  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function serviceLabel(serviceType?: string) {
  if (!serviceType) return "-";

  return serviceType;
}

function CurrentBooking({
  booking,
}: {
  booking: CustomerBooking | null;
}) {
  if (!booking) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Current Booking
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              No active booking
            </h2>
            <p className="mt-1 text-sm text-blue-600">
              Book a car or driver whenever you are ready.
            </p>
          </div>

          <Link
            href="/booking"
            className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Now
          </Link>
        </div>
      </section>
    );
  }

  const driver = booking.driver;
  const car = booking.car;

  const pickupDate = formatDate(booking.bookingDate || booking.createdAt);
  const pickupTime = booking.pickupTime?.trim() || "-";
  const pickupTime12 = pickupTime !== "-" && /^\d{1,2}:\d{2}$/.test(pickupTime) ? (() => { const [h, m] = pickupTime.split(":"); const hour = Number(h); return `${String(hour % 12 || 12).padStart(2, "0")}:${m} ${hour >= 12 ? "PM" : "AM"}`; })() : pickupTime;

  const serviceType = `${booking.tripType || "Local"} (${booking.serviceType || (booking.car ? "Car with Driver" : "Driver Only")})`;

  const status = booking.bookingStatus || "Pending";
  const currentStep = statusStep(status);

  const progress = [
    {
      label: "Booking Requested",
      timestamp: booking.createdAt,
    },
    {
      label: driver ? "Assign Driver & Car" : "Assign Driver",
      timestamp: undefined,
    },
    {
      label: "Booking Confirmed",
      timestamp: booking.statusHistory?.find(
        (item) => item.to === "Confirmed"
      )?.changedAt,
    },
    {
      label: "Trip Ongoing",
      timestamp: booking.startedAt,
    },
    {
      label: "Trip Completed",
      timestamp: booking.completedAt,
    },
  ];

  const progressTimestamp = (value?: string) => {
    if (!value) {
      return {
        time: "-",
        date: "",
      };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return {
        time: "-",
        date: "",
      };
    }

    return {
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Current Booking
            </h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(status)}`}>{status}</span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            {booking.bookingNumber || booking._id || "-"}
          </p>
        </div>

        <Link
          href={`/bookings/${booking._id}`}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          View Details →
        </Link>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.85fr_0.85fr]">
        <div className="min-w-0">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-2">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Pickup
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900">
                    {booking.pickupLocation || "-"}
                  </p>
                </div>
              </div>

              <div className="ml-[7px] h-8 border-l-2 border-dashed border-slate-300" />

              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Drop
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900">
                    {booking.dropLocation || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white">
            <div className="px-2.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-3 w-3" />
                Date
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {pickupDate || "-"}
              </p>
            </div>

            <div className="px-2.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <Clock3 className="h-3 w-3" />
                Pickup Time
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {pickupTime12}
              </p>
            </div>

            <div className="min-w-0 px-2.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Service Type
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-900">
                {serviceType}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Assigned Driver
            </p>

            <div className="mt-2 flex items-center gap-2.5">
              {driver?.imageUrl ? (
                <img
                  src={driver.imageUrl || ""}
                  alt={driver.driverName || "Driver"}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {getInitials(driver?.driverName || "Driver")}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {driver?.driverName || "Not assigned"}
                </p>
                <p className="text-xs text-red-600">
                  {driver?.experience
                    ? `${driver.experience} experience`
                    : "Driver details unavailable"}
                </p>
                {driver?.phoneNumber ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                    <Phone className="h-3 w-3" />
                    {driver.phoneNumber}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Assigned Car
            </p>

            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <CarFront className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {car?.carName || car?.carModel || "Not assigned"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {car?.carNumber ||
                    "Registration unavailable"}
                </p>
                {car?.carModel ? (
                  <p className="text-xs text-slate-600">
                    {car.carModel}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Booking Progress
            </p>
            <span className="text-[10px] font-semibold text-slate-500">
              {statusLabel(status)}
            </span>
          </div>

          <div className="space-y-0">
            {progress.map((item, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const timestamp = progressTimestamp(item.timestamp || undefined);

              return (
                <div
                  key={item.label}
                  className="relative flex min-h-[50px] gap-2.5"
                >
                  {index < progress.length - 1 ? (
                    <span
                      className={`absolute left-[7px] top-4 h-[42px] w-px ${
                        index < currentStep
                          ? "bg-slate-900"
                          : "bg-slate-300"
                      }`}
                    />
                  ) : null}

                  <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white">
                    {isCompleted ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    ) : isCurrent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          isCompleted || isCurrent
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </p>

                      {isCurrent ? (
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                          Current status
                        </p>
                      ) : null}
                    </div>

                    <div className="w-[72px] shrink-0 text-right leading-tight">
                      <p className="text-[10px] font-semibold text-slate-700">
                        {timestamp.time}
                      </p>
                      {timestamp.date ? (
                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {timestamp.date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
function RecentBookings({
  bookings,
}: {
  bookings: CustomerBooking[];
}) {
  const lastFive = bookings.slice(0, 5);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            Recent Bookings
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Your last 5 rides
          </p>
        </div>

        <Link
          href="/bookings"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="p-3">
        {lastFive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No recent bookings.
          </div>
        ) : (
          <div className="space-y-2">
            {lastFive.map((booking) => {
              const carName =
                booking.car?.carName ||
                booking.car?.carModel ||
                "";

              return (
                <div
                  key={booking._id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/50"
                >
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                    {booking.car?.imageUrl ? (
                      <img
                        src={booking.car.imageUrl}
                        alt={carName || "Car"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <CarFront className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-900">
                      {booking.bookingNumber ||
                        `#${booking._id?.slice(-8) || "-"}`}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatShortDateTime(
                        booking.bookingDate || booking.createdAt,
                      )}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-600">
                      {booking.pickupLocation || "-"}{" "}
                      <span className="text-slate-300">→</span>{" "}
                      {booking.dropLocation || "-"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses(
                        booking.bookingStatus,
                      )}`}
                    >
                      {booking.bookingStatus || "Pending"}
                    </span>

                    <Link
                      href={
                        booking._id
                          ? `/bookings/${booking._id}`
                          : "/bookings"
                      }
                      className="text-[11px] font-bold text-slate-700 hover:text-blue-600"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileSummary({
  name,
  email,
  phone,
  role,
}: {
  name: string;
  email: string;
  phone: string;
  role: string;
}) {
  const initials = getInitials(name);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            Profile Summary
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Your account details at a glance.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Edit Profile
        </Link>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xs font-extrabold text-white">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900">
              {name || "Customer"}
            </p>

            <p className="text-xs text-slate-500">
              {role || "Customer account"}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-xs font-medium text-slate-500">Name</span>

            <span className="truncate text-right text-xs font-bold text-slate-900">
              {name || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-xs font-medium text-slate-500">Email</span>

            <span className="max-w-[180px] truncate text-right text-xs font-bold text-slate-900">
              {email || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-xs font-medium text-slate-500">Phone</span>

            <span className="text-right text-xs font-bold text-slate-900">
              {phone || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="text-xs font-medium text-slate-500">
              Account
            </span>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {role || "Customer"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CustomerDashboardPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
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

        setBookings(
          Array.isArray(bookingsRes?.data) ? bookingsRes.data : [],
        );
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const activeBooking = useMemo(
    () =>
      bookings.find((booking) =>
        ACTIVE_STATUSES.includes(booking.bookingStatus || ""),
      ) || null,
    [bookings],
  );

  const recentBookings = useMemo(
    () => bookings.filter((booking) => booking._id !== activeBooking?._id),
    [bookings, activeBooking],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  }, []);

  return (
    <CustomerDashboardLayout>
      <div className="space-y-5">
        {/* Welcome Header */}
        <header className="flex flex-col gap-5 px-1 py-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-600">
              {greeting},
            </p>

            <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight text-slate-950 xl:text-4xl">
              Welcome back{name ? `, ${name}` : ""} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Here&apos;s your current ride status and recent activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Bell className="h-5 w-5" />

              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <Link
              href="/booking"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <CarFront className="h-4 w-4" />
              Book Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading your dashboard…
          </div>
        ) : (
          <>
            <CurrentBooking booking={activeBooking} />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <RecentBookings bookings={recentBookings} />

              <ProfileSummary
                name={name}
                email={email}
                phone={phone}
                role={role}
              />
            </div>
          </>
        )}
      </div>
    </CustomerDashboardLayout>
  );
}