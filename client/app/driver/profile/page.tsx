"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from "@/components/ui/primitives";

import {
  getCustomerProfile,
  getDriverDashboard,
  getAxiosErrorMessage,
  updateDriverAvailability,
  type DriverDashboardData,
} from "@/lib/api";

export default function DriverProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<DriverDashboardData | null>(null);
  const [email, setEmail] = useState("");

  const refresh = async () => {
    const res = await getDriverDashboard();
    setData(res.data);
  };

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const profile = await getCustomerProfile();

        if (!mounted) return;

        setEmail(profile.user?.email ?? "");

        if (profile.user?.role !== "driver") {
          router.replace(
            profile.user?.role === "admin"
              ? "/admin/dashboard"
              : "/dashboard",
          );
          return;
        }

        await refresh();
      } catch {
        if (!mounted) return;

        toast.error("Please login to access your profile");
        router.replace("/login/driver");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleAvailabilityChange = async () => {
    if (!data?.driver?.status) return;

    const nextStatus =
      data.driver.status === "Available" ? "Busy" : "Available";

    try {
      setBusy(true);

      await updateDriverAvailability(nextStatus);

      toast.success(
        nextStatus === "Available"
          ? "You are now available"
          : "You are now busy",
      );

      await refresh();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <LoadingSpinner />
          <span className="text-sm text-slate-600">
            Loading profile...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-600">
          Unable to load driver profile.
        </CardContent>
      </Card>
    );
  }

  const driver = data.driver;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          View your driver information and manage your availability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {driver.driverName || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {driver.phoneNumber || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Experience
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {driver.experience ?? 0} years
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>

              <div className="mt-1">
                <Badge
                  tone={
                    driver.status === "Available"
                      ? "green"
                      : "amber"
                  }
                >
                  {driver.status || "-"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Current availability: {driver.status || "-"}
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                You can change only your availability. Your name,
                phone number, email, password and other account
                details are managed by the administrator.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleAvailabilityChange()}
            >
              {busy
                ? "Updating..."
                : driver.status === "Available"
                  ? "Set Busy"
                  : "Set Available"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
