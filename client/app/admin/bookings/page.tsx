"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type CarType = "AC" | "Non-AC";

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
  carType?: CarType;
  fuelType?: string;
};

type BookingRow = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
  carType?: CarType;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
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
      className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
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
            statusFilter === "All" || statusFilter === "Ongoing"
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
            statusFilter === "All" || statusFilter === "Ongoing"
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
        statusFilter === "All" || statusFilter === "Ongoing"
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
    <main className="w-full px-6 py-6">
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Booking Management
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Review and manage all bookings.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by customer name or phone"
              />
            </div>

            <div className="w-full sm:w-56">
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
        </div>

        {/* Booking table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-600">
                  <th className="px-4 py-3">
                    Customer
                  </th>

                  <th className="px-4 py-3">
                    Phone
                  </th>

                  <th className="px-4 py-3">
                    Service
                  </th>

                  <th className="px-4 py-3">
                    Pickup
                  </th>

                  <th className="px-4 py-3">
                    Drop
                  </th>

                  <th className="px-4 py-3">
                    Driver
                  </th>

                  <th className="px-4 py-3">
                    Car
                  </th>

                  <th className="px-4 py-3">
                    Fare
                  </th>

                  <th className="px-4 py-3">
                    Payment
                  </th>

                  <th className="px-4 py-3">
                    Booking Status
                  </th>

                  <th className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({
                    length: pageSize,
                  }).map((_, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50"
                    >
                      <td
                        className="px-4 py-4"
                        colSpan={13}
                      >
                        <div className="flex items-center gap-3">
                          <LoadingSpinner />

                          <span className="text-sm text-slate-600">
                            Loading bookings…
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6"
                      colSpan={13}
                    >
                      <EmptyState
                        title="No bookings"
                        description={
                          error
                            ? "Could not load bookings. Try again."
                            : "Adjust your search or filters to find bookings."
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
                        b.pricing
                          ?.estimatedTotal,
                    );

                    const payment =
                      b.paymentMethod ?? "—";

                    const status =
                      (
                        b.bookingStatus ??
                        "Pending"
                      ).toString();

                    return (
                      <tr
                        key={bookingId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-semibold text-slate-900">
                            {customer}
                          </div>

                          <div className="mt-1 max-w-36 truncate text-xs text-slate-500">
                            {bookingId}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {phone}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {service}

                          {service ===
                            "Car with Driver" &&
                          b.carType ? (
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {b.carType}
                            </div>
                          ) : null}
                        </td>

                        <td className="max-w-48 px-4 py-3 text-slate-600">
                          {pickup}
                        </td>

                        <td className="max-w-48 px-4 py-3 text-slate-600">
                          {drop}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {driverName}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {carLabel}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {fare}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {payment}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            tone={statusTone(
                              status,
                            )}
                          >
                            {status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <Dropdown label="Manage">
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
                              disabled={
                                status !== "Ongoing"
                              }
                              onClick={() =>
                                openStatusDialog(
                                  b,
                                  "Completed",
                                )
                              }
                            >
                              Complete Booking
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
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            {totalCount === 0
              ? 0
              : (safePage - 1) *
                  pageSize +
                1}
            -
            {Math.min(
              safePage * pageSize,
              totalCount,
            )}{" "}
            of {totalCount} bookings
          </p>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Booking ID
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {viewBooking._id ??
                    "—"}
                </p>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail
                label="Customer"
                value={
                  viewBooking.customerName ??
                  "—"
                }
              />

              <Detail
                label="Phone"
                value={
                  viewBooking.mobileNumber ??
                  "—"
                }
              />

              <Detail
                label="Service"
                value={
                  viewBooking.serviceType ??
                  "—"
                }
              />

              {viewBooking.serviceType ===
                "Car with Driver" ? (
                <Detail
                  label="Car Type"
                  value={
                    viewBooking.carType ??
                    "—"
                  }
                />
              ) : null}

              <Detail
                label="Payment"
                value={
                  viewBooking.paymentMethod ??
                  "—"
                }
              />

              <Detail
                label="Pickup"
                value={
                  viewBooking.pickupLocation ??
                  "—"
                }
              />

              <Detail
                label="Drop"
                value={
                  viewBooking.dropLocation ??
                  "—"
                }
              />

              <Detail
                label="Driver"
                value={
                  viewBooking.driver
                    ?.driverName ??
                  "—"
                }
              />

              <Detail
                label="Car"
                value={
                  viewBooking.car
                    ?.carNumber ??
                  "—"
                }
              />

              <Detail
                label="Fare"
                value={formatMoney(
                  viewBooking.totalAmount ??
                    viewBooking.estimatedFare ??
                    viewBooking.pricing
                      ?.estimatedTotal,
                )}
              />

              <Detail
                label="Created"
                value={formatDate(
                  viewBooking.createdAt ??
                    viewBooking.bookingDate,
                )}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">
                Actions
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setViewOpen(false);
                    openConfirm(
                      viewBooking,
                    );
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
                    openAssign(
                      viewBooking,
                    );
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
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm this booking? It
              will update status to{" "}
              <span className="font-semibold">
                Confirmed
              </span>
              .
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">
                Booking
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {confirmBooking._id ??
                  "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setConfirmDialogOpen(
                    false,
                  )
                }
              >
                Close
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (
                    !confirmBooking?._id
                  )
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

                    setConfirmDialogOpen(
                      false,
                    );

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
                Confirm
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
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">
                Booking
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {statusDialogBooking._id ??
                  "—"}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Current:{" "}
                <span className="font-semibold">
                  {String(
                    statusDialogBooking.bookingStatus ??
                      "Pending",
                  )}
                </span>
              </p>
            </div>

            <div className="w-full">
              <Select
                value={statusToSet}
                onChange={(e) =>
                  setStatusToSet(
                    e.target
                      .value as BookingStatus,
                  )
                }
              >
                {allowedStatuses.map(
                  (s) => (
                    <option
                      key={s}
                      value={s}
                    >
                      {s}
                    </option>
                  ),
                )}
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setStatusDialogOpen(
                    false,
                  )
                }
              >
                Close
              </Button>

              <Button
                type="button"
                variant={
                  statusToSet ===
                  "Cancelled"
                    ? "danger"
                    : "primary"
                }
                onClick={async () => {
                  if (
                    !statusDialogBooking?._id
                  )
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

                    setStatusDialogOpen(
                      false,
                    );

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
                Update
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

  const requestedCarType =
    booking?.carType;

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

        const availableDrivers =
          allDrivers.filter(
            (driver) =>
              driver.status ===
              "Available",
          );

        setDrivers(
          availableDrivers,
        );

        if (isCarWithDriver) {
          const allCars = Array.isArray(
            carResponse?.data,
          )
            ? carResponse.data
            : [];

          const availableCars =
            allCars.filter(
              (car: any) =>
                car?.isAvailable ===
                true,
            );

          setCars(
            availableCars as CarRef[],
          );
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
   * AC / Non-AC requirement.
   *
   * Backend remains the final authority.
   */
  const compatibleCars = useMemo(() => {
    if (!isCarWithDriver) {
      return [];
    }

    if (!requestedCarType) {
      return cars;
    }

    return cars.filter((car) => {
      /*
       * New car records may expose isAC.
       */
      if (
        typeof car.isAC ===
        "boolean"
      ) {
        return requestedCarType ===
          "AC"
          ? car.isAC === true
          : car.isAC === false;
      }

      /*
       * Some responses may expose
       * carType directly.
       */
      if (car.carType) {
        return (
          car.carType ===
          requestedCarType
        );
      }

      /*
       * If the API doesn't expose the
       * vehicle type, don't incorrectly
       * claim compatibility.
       */
      return false;
    });
  }, [
    cars,
    isCarWithDriver,
    requestedCarType,
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
      toast.error(
        getAxiosErrorMessage(
          e as AxiosError,
        ),
      );
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
      <div className="w-full max-w-md space-y-4">
        {/* Booking information */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Booking
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {booking._id ??
                  "—"}
              </p>
            </div>

            <Badge
              tone={statusTone(
                booking.bookingStatus,
              )}
            >
              {booking.bookingStatus ??
                "Pending"}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">
              {booking.serviceType ??
                "Service"}
            </Badge>

            {isCarWithDriver &&
            requestedCarType ? (
              <Badge tone="blue">
                {requestedCarType}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              Could not load resources
            </p>

            <p className="mt-1 text-xs text-red-700">
              {error}
            </p>
          </div>
        ) : null}

        {/* Driver */}
        <div>
          <label
            htmlFor="assign-driver"
            className="mb-1.5 block text-sm font-semibold text-slate-800"
          >
            Driver
          </label>

          <Select
            id="assign-driver"
            value={selectedDriverId}
            onChange={(e) =>
              setSelectedDriverId(
                e.target.value,
              )
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
              /*
               * IMPORTANT:
               * Backend returns `id`,
               * not `_id`.
               *
               * This fixes:
               * Encountered two children with
               * the same key, ""
               */
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
            <p className="mt-1.5 text-xs text-slate-500">
              {selectedDriver.phoneNumber
                ? selectedDriver.phoneNumber
                : "Available driver"}
            </p>
          ) : null}

          {!loadingDrivers &&
          !drivers.length ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              No available drivers.
            </p>
          ) : null}
        </div>

        {/* Car */}
        {isCarWithDriver ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="assign-car"
                className="block text-sm font-semibold text-slate-800"
              >
                Car
              </label>

              {requestedCarType ? (
                <Badge tone="blue">
                  {requestedCarType}
                </Badge>
              ) : null}
            </div>

            <Select
              id="assign-car"
              value={selectedCarId}
              onChange={(e) =>
                setSelectedCarId(
                  e.target.value,
                )
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

              {compatibleCars.map(
                (car) => {
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
                      {car.carName ??
                        "Car"}{" "}
                      -{" "}
                      {car.carNumber ??
                        "No number"}
                    </option>
                  );
                },
              )}
            </Select>

            {requestedCarType ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Showing available{" "}
                {requestedCarType} cars
                only.
              </p>
            ) : null}

            {!loadingCars &&
            !compatibleCars.length ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                No available{" "}
                {requestedCarType ??
                  ""}{" "}
                cars found.
              </p>
            ) : null}

            {selectedCar ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Selected:{" "}
                {selectedCar.carName ??
                  "Car"}{" "}
                •{" "}
                {selectedCar.carNumber ??
                  "No number"}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Assignment summary */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-700">
            Assignment Summary
          </p>

          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                Driver
              </span>

              <span className="font-semibold text-slate-900">
                {selectedDriver
                  ?.driverName ??
                  "Not selected"}
              </span>
            </div>

            {isCarWithDriver ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">
                  Car
                </span>

                <span className="font-semibold text-slate-900">
                  {selectedCar
                    ? `${selectedCar.carName ?? "Car"} - ${
                        selectedCar.carNumber ??
                        "No number"
                      }`
                    : "Not selected"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">
                  Vehicle
                </span>

                <span className="font-semibold text-slate-900">
                  Customer's own car
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-1">
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