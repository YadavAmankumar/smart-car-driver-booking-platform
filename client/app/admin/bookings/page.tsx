"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import axios, { type AxiosError } from "axios";

import {
  Dialog,
  Dropdown,
  EmptyState,
  Input,
  LoadingSpinner,
  Pagination,
  Select,
  Button,
  Badge,
  Drawer as DrawerComponent,
} from "@/components/ui/primitives";

import {
  getCustomerProfile,
  getAxiosErrorMessage,
  getAdminBookings,
  patchAdminBookingStatus,
  assignBookingDriverCar,
  getAdminCars,
} from "@/lib/api";

type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

type DriverRef = {
  _id?: string;
  id?: string;
  driverName?: string;
  experience?: number;
  phoneNumber?: string;
  status?: string;
};

type CarRef = {
  _id?: string;
  id?: string;
  carName?: string;
  carNumber?: string;
  isAvailable?: boolean;
  isAC?: boolean;
  vehicleCategory?: "Mini" | "Sedan" | "XL – 7 Seater" | "Force Traveller";
  fuelType?: string;
};

type BookingRow = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
  tripType?: "Local" | "Outstation";
  vehicleCategory?: "Mini" | "Sedan" | "XL – 7 Seater" | "Force Traveller";
  vehicleAc?: "AC" | "Non-AC";
  travellerCount?: number;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  estimatedHours?: number;
  paymentMethod?: string;
  bookingStatus?: BookingStatus | string;
  createdAt?: string;
  driver?: DriverRef | null;
  car?: CarRef | null;
  pricing?: {
    estimatedTotal?: number;
  };
  totalAmount?: number;
  estimatedFare?: number;
  payment?: {
    amount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    verificationStatus?: string;
    verifiedBy?: {
      _id?: string;
      driverName?: string;
      phoneNumber?: string;
    } | null;
    verifiedByModel?: string;
    verifiedType?: string;
    verifiedAt?: string | null;
    paidAt?: string | null;
  } | null;
};

function formatDate(dateString?: string): string {
  if (!dateString) return "—";

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
  });
}

function statusTone(
  status?: string,
): "neutral" | "blue" | "green" | "amber" | "red" {
  const s = status ?? "";

  if (s === "Pending") return "amber";
  if (s === "Confirmed") return "blue";
  if (s === "Ongoing") return "blue";
  if (s === "Completed") return "green";
  if (s === "Cancelled") return "red";

  return "neutral";
}

function getRecordId(
  record?: { _id?: string; id?: string } | null,
): string {
  return record?._id || record?.id || "";
}

function canManageAssignment(status: string): boolean {
  return (
    status !== "Completed" &&
    status !== "Cancelled" &&
    status !== "Ongoing"
  );
}

function canCancelBooking(status: string): boolean {
  return status === "Pending" || status === "Confirmed";
}

function MenuItem({
  children,
  tone = "default",
  disabled,
  onClick,
}: {
  children: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function BookingActionsDropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] =
    useState<HTMLDivElement | null>(null);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!open || !trigger) return;

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();

      const menuWidth = 192;
      const menuHeight = 190;
      const gap = 8;
      const padding = 8;

      const spaceLeft =
        rect.left - gap - padding;

      const spaceRight =
        window.innerWidth -
        rect.right -
        gap -
        padding;

      let left =
        spaceLeft >= menuWidth
          ? rect.left - menuWidth - gap
          : rect.right + gap;

      if (
        spaceLeft < menuWidth &&
        spaceRight < menuWidth
      ) {
        left = Math.max(
          padding,
          Math.min(
            rect.right - menuWidth,
            window.innerWidth -
              menuWidth -
              padding,
          ),
        );
      }

      let top = rect.top;

      if (
        top + menuHeight >
        window.innerHeight - padding
      ) {
        top =
          window.innerHeight -
          menuHeight -
          padding;
      }

      top = Math.max(
        padding,
        top,
      );

      setPosition({
        top,
        left,
      });
    };

    updatePosition();

    window.addEventListener(
      "resize",
      updatePosition,
    );

    window.addEventListener(
      "scroll",
      updatePosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePosition,
      );

      window.removeEventListener(
        "scroll",
        updatePosition,
        true,
      );
    };
  }, [open, trigger]);

  return (
    <div
      ref={setTrigger}
      className="relative inline-flex"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="gap-2 rounded-lg"
      >
        {label}

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m6 9 6 6 6-6"
          />
        </svg>
      </Button>

      {open
        ? createPortal(
            <div
              className="fixed z-[99999] min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] ring-1 ring-black/5"
              style={{
                top: position.top,
                left: position.left,
              }}
              onClick={() => {
                setOpen(false);
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
export default function AdminBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | BookingStatus
  >("All");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogBooking, setStatusDialogBooking] =
    useState<BookingRow | null>(null);
  const [statusToSet, setStatusToSet] =
    useState<BookingStatus>("Confirmed");

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmBooking, setConfirmBooking] =
    useState<BookingRow | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignBooking, setAssignBooking] =
    useState<BookingRow | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const profile = await getCustomerProfile();
        const role = profile?.user?.role;

        if (!mounted) return;

        if (role !== "admin") {
          toast.error("Access denied");

          window.location.href =
            role === "driver"
              ? "/driver/dashboard"
              : "/dashboard";

          return;
        }

        const data = await getAdminBookings({
          status:
            statusFilter === "All"
              ? undefined
              : statusFilter,
          search,
        });

        if (!mounted) return;

        setRows(
          Array.isArray(data?.data)
            ? (data.data as BookingRow[])
            : [],
        );

        setTotalCount(
          typeof data?.count === "number"
            ? data.count
            : 0,
        );
      } catch (e) {
        if (!mounted) return;

        const msg = getAxiosErrorMessage(
          e as AxiosError,
        );

        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAdminBookings({
          status:
            statusFilter === "All"
              ? undefined
              : statusFilter,
          search,
        });

        if (!mounted) return;

        setRows(
          Array.isArray(data?.data)
            ? (data.data as BookingRow[])
            : [],
        );

        setTotalCount(
          typeof data?.count === "number"
            ? data.count
            : 0,
        );

        setPage(1);
      } catch (e) {
        if (!mounted) return;

        const msg = getAxiosErrorMessage(
          e as AxiosError,
        );

        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize),
  );

  const safePage = Math.min(
    page,
    totalPages,
  );

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return rows.slice(start, end);
  }, [rows, safePage]);

  const openView = (booking: BookingRow) => {
    setViewBooking(booking);
    setViewOpen(true);
  };

  const openStatusDialog = (
    booking: BookingRow,
    newStatus: BookingStatus,
  ) => {
    setStatusDialogBooking(booking);
    setStatusToSet(newStatus);
    setStatusDialogOpen(true);
  };

  const openConfirm = (booking: BookingRow) => {
    setConfirmBooking(booking);
    setConfirmDialogOpen(true);
  };

  const openAssign = (booking: BookingRow) => {
    setAssignBooking(booking);
    setAssignDialogOpen(true);
  };

  const refreshBookings = async () => {
  try {
    const data = await getAdminBookings({
      status:
        statusFilter === "All"
          ? undefined
          : statusFilter,
      search,
    });

    setRows(
      Array.isArray(data?.data)
        ? (data.data as BookingRow[])
        : [],
    );

    setTotalCount(
      typeof data?.count === "number"
        ? data.count
        : 0,
    );
  } catch (e) {
    toast.error(
      getAxiosErrorMessage(e as AxiosError),
    );
  }
};
  const allowedStatuses: BookingStatus[] = [
    "Pending",
    "Confirmed",
    "Ongoing",
    "Completed",
    "Cancelled",
  ];

  return (
    <main className="min-h-full w-full bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f1f5f9_45%,#eef2f7_100%)] px-2 py-3 sm:px-4 lg:px-5">
      <section className="mx-auto w-full max-w-[1500px] space-y-3">

        {/* ========================================================= */}
        {/* PAGE HEADER */}
        {/* ========================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md shadow-slate-900/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 4h10m-9 4h6m-8 5h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                    />
                  </svg>
                </div>

                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-[22px]">
                    Booking Management
                  </h1>

                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Review, assign and manage customer bookings.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-[145px] rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-2 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Current Results
              </p>

              <p className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  bookings
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SEARCH / FILTER BAR */}
        {/* ========================================================= */}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-extrabold tracking-tight text-slate-950">
                Find Bookings
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Search customers or filter bookings by status.
              </p>
            </div>

            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 sm:block">
              {statusFilter === "All"
                ? "All statuses"
                : statusFilter}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-[18px] w-[18px]"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path
                    strokeLinecap="round"
                    d="m20 20-3.5-3.5"
                  />
                </svg>
              </div>

              <div className="[&_input]:pl-10">
                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by customer name or phone"
                />
              </div>
            </div>

            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as typeof statusFilter,
                )
              }
            >
              <option value="All">
                All Statuses
              </option>

              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOOKING TABLE */}
        {/* ========================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
            <div>
              <h2 className="text-xs font-extrabold tracking-tight text-slate-950">
                All Bookings
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Booking details, assignment and payment information.
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
              Page {safePage} of {totalPages}
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-[10px] font-extrabold uppercase tracking-[0.07em] text-slate-500">
                  <th className="w-[15%] bg-slate-50 px-2.5 py-2.5 text-left">Customer</th>
                  <th className="w-[8%] px-2 py-2.5">Phone</th>
                  <th className="w-[11%] px-2 py-2.5">Service &amp; Vehicle</th>
                  <th className="w-[6%] px-2 py-2.5">Booked Hours</th>
                  <th className="w-[10%] px-2 py-2.5">Pickup</th>
                  <th className="w-[10%] px-2 py-2.5">Drop</th>
                  <th className="w-[9%] px-2 py-2.5">Driver</th>
                  <th className="w-[8%] px-2 py-2.5">Car</th>
                  <th className="w-[8%] px-2 py-2.5">Fare (₹)</th>
                  <th className="w-[9%] px-2 py-2.5">Payment</th>
                  <th className="w-[8%] px-2 py-2.5">Status</th>
                  <th className="w-[5%] bg-slate-50 px-1.5 py-2.5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  Array.from({
                    length: pageSize,
                  }).map((_, i) => (
                    <tr key={i}>
                      <td
                        className="px-4 py-5"
                        colSpan={12}
                      >
                        <div className="flex items-center gap-1">
                          <LoadingSpinner />

                          <span className="text-sm text-slate-500">
                            Loading bookings…
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-10"
                      colSpan={12}
                    >
                      <EmptyState
                        title="No bookings found"
                        description={
                          error
                            ? "Could not load bookings. Try again."
                            : "Adjust your search or status filter to find bookings."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((b) => {
                    const bookingId =
                      b._id ?? "—";

                    const customer =
                      b.customerName ?? "—";

                    const phone =
                      b.mobileNumber ?? "—";

                    const service =
                      b.serviceType ?? "—";

                    const pickup =
                      b.pickupLocation ?? "—";

                    const drop =
                      b.dropLocation ?? "—";

                    const driverName =
                      b.driver?.driverName ??
                      "—";

                    const carLabel =
                      b.car?.carNumber ??
                      "—";

                    const fare = formatMoney(
                      b.totalAmount ??
                        b.estimatedFare ??
                        b.pricing?.estimatedTotal,
                    );

                    const paymentMethod =
                      b.payment?.paymentMethod ??
                      b.paymentMethod ??
                      "—";

                    const paymentAmount = formatMoney(
                      b.payment?.amount ??
                        b.totalAmount ??
                        b.estimatedFare ??
                        b.pricing?.estimatedTotal,
                    );

                    const paymentStatus =
                      b.payment?.paymentStatus ?? "Pending";

                    const paymentDriver =
                      b.payment?.verifiedBy?.driverName ??
                      "";

                    const paymentVerifiedType =
                      b.payment?.verifiedType ?? "";

                    const status = (
                      b.bookingStatus ??
                      "Pending"
                    ).toString();

                    return (
                      <tr
                        key={bookingId}
                        className="group border-b border-slate-100/80 transition-colors last:border-b-0 hover:bg-slate-50/70"
                      >
                        {/* Customer */}
                        <td className="bg-white px-2.5 py-2.5 align-top group-hover:bg-slate-50/70">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-100">
                              {customer !== "—"
                                ? customer
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()
                                : "?"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-bold text-slate-900">
                                {customer}
                              </p>

                              <p
                                title={bookingId}
                                className="mt-0.5 max-w-[150px] truncate text-[10px] font-medium text-slate-400"
                              >
                                {bookingId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-2.5 py-2.5 align-top">
                          <span className="truncate text-[11px] font-semibold text-slate-600">
                            {phone}
                          </span>
                        </td>

                        {/* Service */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-800">
                              {service}
                            </p>

                            {service ===
                              "Car with Driver" &&
                            (b.vehicleCategory ||
                              b.vehicleAc) ? (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {b.vehicleCategory ? (
                                  <Badge tone="neutral">
                                    {b.vehicleCategory}
                                  </Badge>
                                ) : null}

                                {b.vehicleAc ? (
                                  <Badge tone="blue">
                                    {b.vehicleAc}
                                  </Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* Hours */}
                        <td className="px-2.5 py-2.5 align-top">
                          <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                            {service === "Driver Only"
                              ? `${b.estimatedHours ?? "—"} hrs`
                              : "—"}
                          </span>
                        </td>

                        {/* Pickup */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="max-w-full min-w-0">
                            <p
                              title={pickup}
                              className="line-clamp-2 text-[10px] font-medium leading-[1.35] text-slate-600"
                            >
                              {pickup}
                            </p>
                          </div>
                        </td>

                        {/* Drop */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="max-w-full min-w-0">
                            <p
                              title={drop}
                              className="line-clamp-2 text-[10px] font-medium leading-[1.35] text-slate-600"
                            >
                              {drop}
                            </p>
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-extrabold text-slate-600 ring-1 ring-slate-200">
                                {driverName !== "—"
                                  ? driverName
                                      .trim()
                                      .charAt(0)
                                      .toUpperCase()
                                  : "—"}
                              </div>

                              <span className="truncate text-[11px] font-bold text-slate-700">
                                {driverName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Car */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-700">
                              {carLabel}
                            </p>

                            {b.car?.carName ? (
                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {b.car.carName}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Fare */}
                        <td className="px-2.5 py-2.5 align-top">
                          <span className="whitespace-nowrap text-[12px] font-extrabold text-slate-950">
                            {fare}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="min-w-0">
                            <p className="whitespace-nowrap text-[11px] font-extrabold text-slate-950">
                              {paymentAmount}
                            </p>

                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                              {paymentMethod}
                            </p>

                            {paymentStatus === "Paid" &&
                            paymentDriver ? (
                              <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-[1.35] text-emerald-700">
                                {paymentVerifiedType ===
                                "Cash Collection"
                                  ? `Cash Collected by ${paymentDriver}`
                                  : paymentVerifiedType ===
                                      "UPI Driver Confirmation"
                                    ? `UPI confirmed by ${paymentDriver}`
                                    : `Payment confirmed by ${paymentDriver}`}
                              </p>
                            ) : (
                              <span className="mt-1 inline-flex rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Booking Status */}
                        <td className="px-2.5 py-2.5 align-top">
                          <Badge
                            tone={statusTone(status)}
                          >
                            {status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className=" z-0 bg-white px-3 py-2 align-top text-center shadow-[-1px_0_0_0_rgba(241,245,249,1)] group-hover:bg-slate-50/70">
                          <BookingActionsDropdown
  label={
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200"
      aria-label="Manage booking"
      title="Manage booking"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-[18px] w-[18px]"
        aria-hidden="true"
      >
        <circle cx="5" cy="12" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="19" cy="12" r="1.7" />
      </svg>
    </span>
  }
>
                            <MenuItem
                              onClick={() =>
                                openView(b)
                              }
                            >
                              View Details
                            </MenuItem>

                            <MenuItem
                              disabled={
                                !canManageAssignment(
                                  status,
                                )
                              }
                              onClick={() =>
                                openAssign(b)
                              }
                            >
                              Assign Trip
                            </MenuItem>

                            <MenuItem
                              disabled={
                                status ===
                                  "Confirmed" ||
                                status ===
                                  "Completed" ||
                                status ===
                                  "Cancelled"
                              }
                              onClick={() =>
                                openConfirm(b)
                              }
                            >
                              Confirm Booking
                            </MenuItem>

                            <MenuItem
                              tone="danger"
                              disabled={
                                !canCancelBooking(
                                  status,
                                )
                              }
                              onClick={() =>
                                openStatusDialog(
                                  b,
                                  "Cancelled",
                                )
                              }
                            >
                              Cancel Booking
                            </MenuItem>
                          </BookingActionsDropdown>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* PAGINATION */}
          {/* ========================================================= */}

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {totalCount === 0
                  ? 0
                  : (safePage - 1) *
                      pageSize +
                    1}
                -
                {Math.min(
                  safePage * pageSize,
                  totalCount,
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {totalCount}
              </span>{" "}
              bookings
            </p>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* VIEW DETAILS DRAWER */}
      {/* ========================================================= */}

      <DrawerComponent
        open={viewOpen}
        title="Booking Details"
        onClose={() =>
          setViewOpen(false)
        }
      >
        {viewBooking ? (
          <div className="space-y-4">

            {/* Booking Header */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                    {viewBooking.customerName
                      ? viewBooking.customerName
                          .trim()
                          .charAt(0)
                          .toUpperCase()
                      : "?"}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900">
                      {viewBooking.customerName ?? "—"}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {viewBooking.mobileNumber ?? "—"}
                    </p>
                  </div>
                </div>

                <Badge
                  tone={statusTone(
                    viewBooking.bookingStatus,
                  )}
                >
                  {viewBooking.bookingStatus ??
                    "Pending"}
                </Badge>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Booking ID
                </p>

                <p className="mt-1 break-all text-xs font-semibold text-slate-700">
                  {viewBooking._id ?? "—"}
                </p>
              </div>
            </div>

            {/* Service Information */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 17h14M7 17v2m10-2v2M6 13h12l-1.5-5h-9L6 13Zm0 0a2 2 0 0 0-2 2v1h16v-1a2 2 0 0 0-2-2"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Service Information
                  </p>

                  <p className="text-xs text-slate-500">
                    Requested booking details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail
                  label="Service"
                  value={
                    viewBooking.serviceType ?? "—"
                  }
                />

                {viewBooking.serviceType ===
                "Driver Only" ? (
                  <Detail
                    label="Booked Hours"
                    value={
                      viewBooking.estimatedHours !==
                      undefined
                        ? `${viewBooking.estimatedHours} hrs`
                        : "—"
                    }
                  />
                ) : null}

                {viewBooking.serviceType ===
                "Car with Driver" ? (
                  <>
                    <Detail
                      label="Vehicle Category"
                      value={
                        viewBooking.vehicleCategory ??
                        "—"
                      }
                    />

                    <Detail
                      label="AC / Non-AC"
                      value={
                        viewBooking.vehicleAc ?? "—"
                      }
                    />
                  </>
                ) : null}

                <Detail
                  label="Payment Method"
                  value={
                    viewBooking.paymentMethod ??
                    "—"
                  }
                />

                <Detail
                  label="Created"
                  value={formatDate(
                    viewBooking.createdAt ??
                      viewBooking.bookingDate,
                  )}
                />
              </div>
            </div>

            {/* Route */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                  >
                    <circle cx="6" cy="18" r="2" />
                    <circle cx="18" cy="6" r="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Trip Route
                  </p>

                  <p className="text-xs text-slate-500">
                    Pickup and destination
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pickup
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">
                      {viewBooking.pickupLocation ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="ml-3.5 h-5 border-l border-dashed border-slate-300" />

                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Drop
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">
                      {viewBooking.dropLocation ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 2v6m-3-3h6"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Assignment
                  </p>

                  <p className="text-xs text-slate-500">
                    Driver and vehicle
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Driver
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {viewBooking.driver?.driverName ?? "Not assigned"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Car
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {viewBooking.car?.carNumber ?? "Not assigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment / Fare */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-lg shadow-slate-900/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Fare
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(
                      viewBooking.totalAmount ??
                        viewBooking.estimatedFare ??
                        viewBooking.pricing
                          ?.estimatedTotal,
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Payment
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {viewBooking.paymentMethod ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Booking Actions
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setViewOpen(false);
                    openConfirm(viewBooking);
                  }}
                  disabled={
                    viewBooking.bookingStatus !==
                    "Pending"
                  }
                >
                  Confirm Booking
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setViewOpen(false);
                    openAssign(viewBooking);
                  }}
                  disabled={
                    !canManageAssignment(
                      String(
                        viewBooking.bookingStatus ??
                          "Pending",
                      ),
                    )
                  }
                >
                  Assign Trip
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setViewOpen(false);
                    openStatusDialog(
                      viewBooking,
                      "Cancelled",
                    );
                  }}
                  disabled={
                    !canCancelBooking(
                      String(
                        viewBooking.bookingStatus ??
                          "Pending",
                      ),
                    )
                  }
                >
                  Cancel Booking
                </Button>
              </div>
            </div>

          </div>
        ) : null}
      </DrawerComponent>

      {/* ========================================================= */}
      {/* CONFIRM BOOKING DIALOG */}
      {/* ========================================================= */}

      <Dialog
        open={confirmDialogOpen}
        title="Confirm Booking"
        onClose={() =>
          setConfirmDialogOpen(false)
        }
      >
        {confirmBooking ? (
          <div className="space-y-5">

            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-[18px] w-[18px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Confirm this booking?
                </p>

                <p className="mt-0.5 text-xs text-slate-600">
                  The booking status will change to Confirmed.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Booking ID
              </p>

              <p className="mt-1 break-all text-sm font-bold text-slate-900">
                {confirmBooking._id ?? "—"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {confirmBooking.customerName ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fare
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatMoney(
                      confirmBooking.totalAmount ??
                        confirmBooking.estimatedFare ??
                        confirmBooking.pricing?.estimatedTotal,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setConfirmDialogOpen(false)
                }
              >
                Close
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (!confirmBooking?._id)
                    return;

                  try {
                    const res =
                      await patchAdminBookingStatus(
                        confirmBooking._id,
                        "Confirmed",
                      );

                    toast.success(
                      res?.message ??
                        "Booking confirmed",
                    );

                    setConfirmDialogOpen(false);

                    await refreshBookings();
                  } catch (e) {
                    toast.error(
                      getAxiosErrorMessage(
                        e as AxiosError,
                      ),
                    );
                  }
                }}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* ========================================================= */}
      {/* STATUS DIALOG */}
      {/* ========================================================= */}

      <Dialog
        open={statusDialogOpen}
        title="Update Booking Status"
        onClose={() =>
          setStatusDialogOpen(false)
        }
      >
        {statusDialogBooking ? (
          <div className="space-y-5">

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Booking ID
                  </p>

                  <p className="mt-1 break-all text-sm font-bold text-slate-900">
                    {statusDialogBooking._id ?? "—"}
                  </p>
                </div>

                <Badge
                  tone={statusTone(
                    String(
                      statusDialogBooking.bookingStatus ??
                        "Pending",
                    ),
                  )}
                >
                  {String(
                    statusDialogBooking.bookingStatus ??
                      "Pending",
                  )}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {statusDialogBooking.customerName ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {statusDialogBooking.mobileNumber ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2">
                <p className="text-sm font-bold text-slate-900">
                  New Status
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Select the status you want to apply.
                </p>
              </div>

              <Select
                value={statusToSet}
                onChange={(e) =>
                  setStatusToSet(
                    e.target.value as BookingStatus,
                  )
                }
              >
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div
              className={`rounded-xl border p-3 text-xs font-medium ${
                statusToSet === "Cancelled"
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-blue-100 bg-blue-50 text-blue-700"
              }`}
            >
              {statusToSet === "Cancelled"
                ? "This action will mark the booking as cancelled."
                : `The booking will be updated to ${statusToSet}.`}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setStatusDialogOpen(false)
                }
              >
                Close
              </Button>

              <Button
                type="button"
                variant={
                  statusToSet === "Cancelled"
                    ? "danger"
                    : "primary"
                }
                onClick={async () => {
                  if (!statusDialogBooking?._id)
                    return;

                  try {
                    const res =
                      await patchAdminBookingStatus(
                        statusDialogBooking._id,
                        statusToSet,
                      );

                    toast.success(
                      res?.message ??
                        "Booking updated",
                    );

                    setStatusDialogOpen(false);

                    await refreshBookings();
                  } catch (e) {
                    toast.error(
                      getAxiosErrorMessage(
                        e as AxiosError,
                      ),
                    );
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* ========================================================= */}
      {/* ASSIGN TRIP DIALOG */}
      {/* ========================================================= */}

      <AssignTripDialog
        open={assignDialogOpen}
        booking={assignBooking}
        onClose={() =>
          setAssignDialogOpen(false)
        }
        onAssigned={() => {
          setAssignDialogOpen(false);
          void refreshBookings();
        }}
      />
    </main>
  );
}

/* =============================================================== */
/* DETAIL */
/* =============================================================== */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

/* =============================================================== */
/* DRIVER API */
/* =============================================================== */

type DriverRefFromApi = {
  id?: string;
  driverName?: string;
  experience?: number;
  phoneNumber?: string;
  status?: string;
};

async function fetchAllDriversAuthenticated(): Promise<
  DriverRefFromApi[]
> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5001/api/v1";

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(
          "token",
        )
      : null;

  const res = await axios.get<{
    success?: boolean;
    count?: number;
    data?: DriverRefFromApi[];
  }>(
    `${apiBaseUrl}/drivers`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  const data = res.data?.data;

  return Array.isArray(data)
    ? data
    : [];
}

/* =============================================================== */
/* ASSIGN TRIP DIALOG */
/* =============================================================== */

function AssignTripDialog({
  open,
  booking,
  onClose,
  onAssigned,
}: {
  open: boolean;
  booking: BookingRow | null;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [drivers, setDrivers] =
    useState<DriverRefFromApi[]>([]);

  const [cars, setCars] = useState<
    CarRef[]
  >([]);

  const [selectedDriverId, setSelectedDriverId] =
    useState("");

  const [selectedCarId, setSelectedCarId] =
    useState("");

  const [loadingDrivers, setLoadingDrivers] =
    useState(false);

  const [loadingCars, setLoadingCars] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [assigning, setAssigning] =
    useState(false);

  const isCarWithDriver =
    booking?.serviceType ===
    "Car with Driver";

  const requestedVehicleCategory =
    booking?.vehicleCategory;

  const requestedVehicleAc =
    booking?.vehicleAc;

  useEffect(() => {
    if (!open || !booking) return;

    const currentBooking = booking;

    let mounted = true;

    async function loadResources() {
      try {
        setError(null);
        setLoadingDrivers(true);
        setLoadingCars(
          isCarWithDriver,
        );

        const driverPromise =
          fetchAllDriversAuthenticated();

        const carPromise =
          isCarWithDriver
            ? getAdminCars()
            : Promise.resolve(null);

        const [
          allDrivers,
          carResponse,
        ] = await Promise.all([
          driverPromise,
          carPromise,
        ]);

        if (!mounted) return;

        setDrivers(allDrivers);

        if (isCarWithDriver) {
          const allCars = Array.isArray(
            carResponse?.data,
          )
            ? carResponse.data
            : [];

          setCars(allCars as CarRef[]);
        } else {
          setCars([]);
        }

        /*
         * If booking already has a driver,
         * preselect it.
         */
        const existingDriverId =
          getRecordId(
            currentBooking.driver,
          );

        if (existingDriverId) {
          setSelectedDriverId(
            existingDriverId,
          );
        } else {
          setSelectedDriverId("");
        }

        /*
         * If booking already has a car,
         * preselect it.
         */
        const existingCarId =
          getRecordId(
            currentBooking.car,
          );

        if (
          isCarWithDriver &&
          existingCarId
        ) {
          setSelectedCarId(
            existingCarId,
          );
        } else {
          setSelectedCarId("");
        }
      } catch (e) {
        if (!mounted) return;

        setError(
          getAxiosErrorMessage(
            e as AxiosError,
          ),
        );
      } finally {
        if (!mounted) return;

        setLoadingDrivers(
          false,
        );

        setLoadingCars(false);
      }
    }

    void loadResources();

    return () => {
      mounted = false;
    };
  }, [
    open,
    booking,
    isCarWithDriver,
  ]);

  /*
   * Filter cars according to customer's
   * vehicle category and AC / Non-AC requirement.
   *
   * Backend remains the final authority.
   */
  const compatibleCars = useMemo(() => {
    if (!isCarWithDriver) {
      return [];
    }

    return cars.filter((car) => {
      if (
        requestedVehicleCategory &&
        car.vehicleCategory !== requestedVehicleCategory
      ) {
        return false;
      }

      if (requestedVehicleAc) {
        if (typeof car.isAC !== "boolean") {
          return false;
        }

        if (
          requestedVehicleAc === "AC" &&
          car.isAC !== true
        ) {
          return false;
        }

        if (
          requestedVehicleAc === "Non-AC" &&
          car.isAC !== false
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    cars,
    isCarWithDriver,
    requestedVehicleCategory,
    requestedVehicleAc,
  ]);

  const selectedDriver =
    drivers.find(
      (driver) =>
        driver.id ===
        selectedDriverId,
    );

  const selectedCar =
    compatibleCars.find(
      (car) =>
        getRecordId(car) ===
        selectedCarId,
    );

  const handleAssign = async () => {
    if (!booking?._id) {
      toast.error(
        "Booking id missing",
      );
      return;
    }

    if (!selectedDriverId) {
      toast.error(
        "Please select a driver.",
      );
      return;
    }

    if (
      isCarWithDriver &&
      !selectedCarId
    ) {
      toast.error(
        "Please select a compatible car.",
      );
      return;
    }

    try {
      setAssigning(true);

      /*
       * DRIVER ONLY:
       * {
       *   driverId
       * }
       *
       * CAR WITH DRIVER:
       * {
       *   driverId,
       *   carId
       * }
       *
       * Both are sent through ONE API call.
       */
      const payload =
        isCarWithDriver
          ? {
              driverId:
                selectedDriverId,
              carId:
                selectedCarId,
            }
          : {
              driverId:
                selectedDriverId,
            };

      await assignBookingDriverCar(
        booking._id,
        payload,
      );

      toast.success(
        isCarWithDriver
          ? "Driver and car assigned successfully"
          : "Driver assigned successfully",
      );

      onAssigned();
    } catch (e) {
      const message = getAxiosErrorMessage(e as AxiosError);

      if (
        message.toLowerCase().includes("already reserved") ||
        message.toLowerCase().includes("overlapping booking")
      ) {
        const bookingDate = booking.bookingDate
          ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "this date";

        setError(
          `Selected driver/car is already assigned on ${bookingDate}. Please choose another driver or car.`,
        );
      } else {
        setError(message);
      }
    } finally {
      setAssigning(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog
      open={open}
      title="Assign Trip"
      onClose={() => {
        if (!assigning) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg max-h-[calc(100vh-7rem)] overflow-y-auto space-y-5 pr-1">

        {/* Booking summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                {booking.customerName
                  ? booking.customerName
                      .trim()
                      .charAt(0)
                      .toUpperCase()
                  : "?"}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {booking.customerName ?? "Customer"}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  {booking.mobileNumber ?? "—"}
                </p>
              </div>
            </div>

            <Badge
              tone={statusTone(
                booking.bookingStatus,
              )}
            >
              {booking.bookingStatus ?? "Pending"}
            </Badge>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Booking ID
            </p>

            <p className="mt-1 break-all text-xs font-semibold text-slate-700">
              {booking._id ?? "—"}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">
              {booking.serviceType ?? "Service"}
            </Badge>

            {isCarWithDriver &&
            requestedVehicleCategory ? (
              <Badge tone="blue">
                {requestedVehicleCategory}
              </Badge>
            ) : null}

            {isCarWithDriver &&
            requestedVehicleAc ? (
              <Badge tone="blue">
                {requestedVehicleAc}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                !
              </div>

              <div>
                <p className="text-sm font-bold text-red-800">
                  Assignment Failed
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Driver selection */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-[18px] w-[18px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                />
                <circle cx="9" cy="7" r="4" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 8v6m-3-3h6"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Assign Driver
              </p>

              <p className="text-xs text-slate-500">
                Select the driver for this booking.
              </p>
            </div>
          </div>

          <label
            htmlFor="assign-driver"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Driver
          </label>

          <Select
            id="assign-driver"
            value={selectedDriverId}
            onChange={(e) =>
              setSelectedDriverId(e.target.value)
            }
            disabled={
              loadingDrivers ||
              assigning
            }
          >
            <option value="">
              {loadingDrivers
                ? "Loading drivers..."
                : "Select driver"}
            </option>

            {drivers.map((driver) => {
              const driverId =
                driver.id ?? "";

              if (!driverId) {
                return null;
              }

              return (
                <option
                  key={driverId}
                  value={driverId}
                >
                  {driver.driverName ??
                    "Unnamed Driver"}
                  {typeof driver.experience ===
                  "number"
                    ? ` • ${driver.experience} yrs`
                    : ""}
                </option>
              );
            })}
          </Select>

          {selectedDriver ? (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-500">
                Selected driver
              </span>

              <span className="text-xs font-bold text-slate-800">
                {selectedDriver.phoneNumber ??
                  "Available driver"}
              </span>
            </div>
          ) : null}

          {!loadingDrivers &&
          !drivers.length ? (
            <p className="mt-2 text-xs font-medium text-red-600">
              No available drivers.
            </p>
          ) : null}
        </div>

        {/* Car selection */}
        {isCarWithDriver ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 17h14M7 17v2m10-2v2M6 13h12l-1.5-5h-9L6 13Zm0 0a2 2 0 0 0-2 2v1h16v-1a2 2 0 0 0-2-2"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Assign Car
                  </p>

                  <p className="text-xs text-slate-500">
                    Only compatible vehicles are shown.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-1.5">
                {requestedVehicleCategory ? (
                  <Badge tone="blue">
                    {requestedVehicleCategory}
                  </Badge>
                ) : null}

                {requestedVehicleAc ? (
                  <Badge tone="blue">
                    {requestedVehicleAc}
                  </Badge>
                ) : null}
              </div>
            </div>

            <label
              htmlFor="assign-car"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Car
            </label>

            <Select
              id="assign-car"
              value={selectedCarId}
              onChange={(e) =>
                setSelectedCarId(e.target.value)
              }
              disabled={
                loadingCars ||
                assigning
              }
            >
              <option value="">
                {loadingCars
                  ? "Loading cars..."
                  : compatibleCars.length
                    ? "Select compatible car"
                    : "No compatible cars"}
              </option>

              {compatibleCars.map((car) => {
                const carId =
                  getRecordId(car);

                if (!carId) {
                  return null;
                }

                return (
                  <option
                    key={carId}
                    value={carId}
                  >
                    {car.carName ?? "Car"} -{" "}
                    {car.carNumber ?? "No number"}
                  </option>
                );
              })}
            </Select>

            {requestedVehicleCategory ||
            requestedVehicleAc ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Showing available{" "}
                {requestedVehicleCategory ??
                  "matching category"}{" "}
                {requestedVehicleAc
                  ? `• ${requestedVehicleAc}`
                  : ""}{" "}
                cars only.
              </p>
            ) : null}

            {!loadingCars &&
            !compatibleCars.length ? (
              <p className="mt-2 text-xs font-medium text-red-600">
                No available matching cars found.
              </p>
            ) : null}

            {selectedCar ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-medium text-slate-500">
                  Selected car
                </span>

                <span className="text-right text-xs font-bold text-slate-800">
                  {selectedCar.carName ?? "Car"}{" "}
                  •{" "}
                  {selectedCar.carNumber ??
                    "No number"}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Assignment summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-bold text-slate-900">
              Assignment Summary
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Review the selected resources before assigning.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-3">
              <span className="text-xs font-medium text-slate-500">
                Driver
              </span>

              <span className="max-w-[65%] text-right text-sm font-bold text-slate-900">
                {selectedDriver?.driverName ??
                  "Not selected"}
              </span>
            </div>

            {isCarWithDriver ? (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-3">
                <span className="text-xs font-medium text-slate-500">
                  Car
                </span>

                <span className="max-w-[65%] text-right text-sm font-bold text-slate-900">
                  {selectedCar
                    ? `${selectedCar.carName ?? "Car"} - ${
                        selectedCar.carNumber ??
                        "No number"
                      }`
                    : "Not selected"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-3">
                <span className="text-xs font-medium text-slate-500">
                  Vehicle
                </span>

                <span className="text-right text-sm font-bold text-slate-900">
                  Customer's own car
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-1 pt-4 pb-1 backdrop-blur-sm sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={assigning}
          >
            Close
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() =>
              void handleAssign()
            }
            disabled={
              assigning ||
              loadingDrivers ||
              loadingCars ||
              !selectedDriverId ||
              (isCarWithDriver &&
                !selectedCarId)
            }
          >
            {assigning ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                Assigning…
              </span>
            ) : (
              "Assign Trip"
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}