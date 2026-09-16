"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from "@/components/ui/primitives";
import {
  getAxiosErrorMessage,
  getCustomerProfile,
  getDriverBookings,
  type DriverBooking,
} from "@/lib/api";

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DriverCarPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const profile = await getCustomerProfile();

        if (!mounted) return;

        if (profile.user?.role !== "driver") {
          router.replace(
            profile.user?.role === "admin"
              ? "/admin/dashboard"
              : "/dashboard",
          );
          return;
        }

        const response = await getDriverBookings();

        if (mounted) {
          setBookings(response.data || []);
        }
      } catch (error) {
        if (!mounted) return;

        toast.error(getAxiosErrorMessage(error));
        router.replace("/login/driver");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const assignedCarBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.serviceType === "Car with Driver" &&
          booking.car,
      ),
    [bookings],
  );

  const activeCarBooking = useMemo(() => {
    return (
      assignedCarBookings.find(
        (booking) => booking.bookingStatus === "Ongoing",
      ) ||
      assignedCarBookings.find(
        (booking) => booking.bookingStatus === "Confirmed",
      ) ||
      assignedCarBookings[0] ||
      null
    );
  }, [assignedCarBookings]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 text-slate-600">
          <LoadingSpinner />
          Loading assigned car...
        </CardContent>
      </Card>
    );
  }

  if (!activeCarBooking?.car) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-xl font-bold text-slate-900">
            Assigned Car
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            View the car assigned to your Car with Driver booking.
          </p>
        </section>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-slate-900">
              No car currently assigned
            </p>

            <p className="mt-1 text-sm text-slate-500">
              You may have a Driver Only booking or the admin has not
              assigned a car yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const car = activeCarBooking.car;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-bold text-slate-900">
          Assigned Car
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Car assigned by the admin for your current booking.
        </p>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{car.carName || "Assigned Car"}</CardTitle>

            <p className="mt-1 text-sm text-slate-500">
              {car.carNumber || "Car number unavailable"}
            </p>
          </div>

          <Badge
            tone={
              activeCarBooking.bookingStatus === "Ongoing"
                ? "amber"
                : "green"
            }
          >
            {activeCarBooking.bookingStatus || "Assigned"}
          </Badge>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Car Name
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {car.carName || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Car Number
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {car.carNumber || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Car Type
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {car.carType || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              AC
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {car.isAC === true
                ? "AC"
                : car.isAC === false
                  ? "Non-AC"
                  : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Booking</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Customer
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {activeCarBooking.customer?.name ||
                activeCarBooking.customerName ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Customer Phone
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {activeCarBooking.customer?.phone ||
                activeCarBooking.mobileNumber ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Pickup
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeCarBooking.pickupLocation || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Drop
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeCarBooking.dropLocation || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Booking Date
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {formatDate(activeCarBooking.bookingDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Pickup Time
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeCarBooking.pickupTime || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Service
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeCarBooking.serviceType || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Car Requirement
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeCarBooking.carType || "-"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
