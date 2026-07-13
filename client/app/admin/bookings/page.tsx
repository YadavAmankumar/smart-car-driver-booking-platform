"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Dialog,
  EmptyState,
  Input,
  LoadingSpinner,
  Pagination,
  Select,
  Button,
  Badge,
  Drawer as DrawerComponent,
  Textarea,
} from "@/components/ui/primitives";
import {
  getCustomerProfile,
  getAxiosErrorMessage,
  getAdminBookings,
  patchAdminBookingStatus,
  assignBookingDriverCar,
  getAdminCars,
} from "@/lib/api";
import axios, { type AxiosError } from "axios";



type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

type DriverRef = {
  _id?: string;
  driverName?: string;
  experience?: number;
  phoneNumber?: string;
};

type CarRef = {
  _id?: string;
  carName?: string;
  carNumber?: string;
  isAvailable?: boolean;
};

type BookingRow = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
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
  return n.toLocaleString(undefined, { style: "currency", currency: "INR" });
}

function statusTone(status?: string): "neutral" | "blue" | "green" | "amber" | "red" {
  const s = status ?? "";
  if (s === "Pending") return "amber";
  if (s === "Confirmed") return "blue";
  if (s === "Completed") return "green";
  if (s === "Cancelled") return "red";
  return "neutral";
}

export default function AdminBookingsPage() {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>("All");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogBooking, setStatusDialogBooking] = useState<BookingRow | null>(null);
  const [statusToSet, setStatusToSet] = useState<BookingStatus>("Confirmed");

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState<BookingRow | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<BookingRow | null>(null);
  const [assignType, setAssignType] = useState<"driver" | "car">("driver");

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
          window.location.href = role === "driver" ? "/driver/dashboard" : "/dashboard";
          return;
        }

        const data = await getAdminBookings({
          status: statusFilter === "All" ? undefined : statusFilter,
          search,
        });

        if (!mounted) return;
        setRows(Array.isArray(data?.data) ? (data.data as BookingRow[]) : []);
        setTotalCount(typeof data?.count === "number" ? data.count : 0);
      } catch (e) {
        if (!mounted) return;
        const msg = getAxiosErrorMessage(e as AxiosError);
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
          status: statusFilter === "All" ? undefined : statusFilter,
          search,
        });

        if (!mounted) return;
        setRows(Array.isArray(data?.data) ? (data.data as BookingRow[]) : []);
        setTotalCount(typeof data?.count === "number" ? data.count : 0);
        setPage(1);
      } catch (e) {
        if (!mounted) return;
        const msg = getAxiosErrorMessage(e as AxiosError);
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

  const debouncedSearch = useMemo(() => search, [search]);
  void debouncedSearch;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, safePage]);

  const openView = (booking: BookingRow) => {
    setViewBooking(booking);
    setViewOpen(true);
  };

  const openStatusDialog = (booking: BookingRow, newStatus: BookingStatus) => {
    setStatusDialogBooking(booking);
    setStatusToSet(newStatus);
    setStatusDialogOpen(true);
  };

  const openConfirm = (booking: BookingRow) => {
    setConfirmBooking(booking);
    setConfirmDialogOpen(true);
  };

  const openAssign = (booking: BookingRow, type: "driver" | "car") => {
    setAssignBooking(booking);
    setAssignType(type);
    setAssignDialogOpen(true);
  };

  const refreshBookings = async () => {
    try {
      const data = await getAdminBookings({
        status: statusFilter === "All" ? undefined : statusFilter,
        search,
      });
      setRows(Array.isArray(data?.data) ? (data.data as BookingRow[]) : []);
      setTotalCount(typeof data?.count === "number" ? data.count : 0);
    } catch (e) {
      toast.error(getAxiosErrorMessage(e as AxiosError));
    }
  };

  const allowedStatuses: BookingStatus[] = [

    "Pending",
    "Confirmed",
    "Completed",
    "Cancelled",
  ];

  return (
    <main className="w-full px-6 py-6">
      <section className="space-y-4">

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Booking Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review and manage all bookings.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name or phone"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="All">All Statuses</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-600">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Drop</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Booking Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4" colSpan={13}>
                        <div className="flex items-center gap-3">
                          <LoadingSpinner />
                          <span className="text-sm text-slate-600">Loading bookings…</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={13}>
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
                    const bookingId = b._id ?? "—";
                    const customer = b.customerName ?? "—";
                    const phone = b.mobileNumber ?? "—";
                    const service = b.serviceType ?? "—";
                    const pickup = b.pickupLocation ?? "—";
                    const drop = b.dropLocation ?? "—";
                    const driverName =
                      (b.driver as DriverRef | null | undefined)?.driverName ??
                      "—";
                    const carLabel =
                      (b.car as CarRef | null | undefined)?.carNumber ?? "—";
                    const fare = formatMoney(b.totalAmount ?? b.estimatedFare ?? b.pricing?.estimatedTotal);
                    const payment = b.paymentMethod ?? "—";
                    const status = (b.bookingStatus ?? "Pending").toString();
                    const created = formatDate(b.createdAt ?? b.bookingDate);

                    return (
                      <tr key={bookingId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{bookingId}</td>
                        <td className="px-4 py-3 text-slate-700">{customer}</td>
                        <td className="px-4 py-3 text-slate-600">{phone}</td>
                        <td className="px-4 py-3 text-slate-600">{service}</td>
                        <td className="px-4 py-3 text-slate-600">{pickup}</td>
                        <td className="px-4 py-3 text-slate-600">{drop}</td>
                        <td className="px-4 py-3 text-slate-600">{driverName}</td>
                        <td className="px-4 py-3 text-slate-600">{carLabel}</td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">{fare}</td>
                        <td className="px-4 py-3 text-slate-600">{payment}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(status)}>{status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{created}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openView(b)}
                            >
                              View
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              disabled={status === "Confirmed" || status === "Completed" || status === "Cancelled"}
                              onClick={() => openConfirm(b)}
                            >
                              Confirm
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={status !== "Pending"}
                              onClick={() => openStatusDialog(b, "Completed")}
                            >
                              Complete
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={status === "Cancelled"}
                              onClick={() => openStatusDialog(b, "Cancelled")}
                            >
                              Cancel
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={status === "Completed" || status === "Cancelled"}
                              onClick={() => openAssign(b, "driver")}
                            >
                              Assign Driver
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={
                                b.serviceType !== "Car with Driver" ||
                                status === "Completed" ||
                                status === "Cancelled"
                              }
                              onClick={() => openAssign(b, "car")}
                            >
                              Assign Car
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openStatusDialog(b, "Confirmed")}
                            >
                              Update
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, totalCount)} of {totalCount} bookings
          </p>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      {/* View Details Drawer */}
      <DrawerComponent
        open={viewOpen}
        title="Booking Details"
        onClose={() => setViewOpen(false)}
      >
        {viewBooking ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">Booking ID</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{viewBooking._id ?? "—"}</p>
              </div>
              <Badge tone={statusTone(viewBooking.bookingStatus)}>
                {viewBooking.bookingStatus ?? "Pending"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Customer" value={viewBooking.customerName ?? "—"} />
              <Detail label="Phone" value={viewBooking.mobileNumber ?? "—"} />
              <Detail label="Service" value={viewBooking.serviceType ?? "—"} />
              <Detail label="Payment" value={viewBooking.paymentMethod ?? "—"} />
              <Detail label="Pickup" value={viewBooking.pickupLocation ?? "—"} />
              <Detail label="Drop" value={viewBooking.dropLocation ?? "—"} />
              <Detail
                label="Driver"
                value={
                  viewBooking.driver?.driverName
                    ? viewBooking.driver.driverName
                    : "—"
                }
              />
              <Detail
                label="Car"
                value={viewBooking.car?.carNumber ?? "—"}
              />
              <Detail
                label="Fare"
                value={formatMoney(
                  viewBooking.totalAmount ?? viewBooking.estimatedFare ?? viewBooking.pricing?.estimatedTotal,
                )}
              />
              <Detail label="Created" value={formatDate(viewBooking.createdAt ?? viewBooking.bookingDate)} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">Actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setViewOpen(false);
                    openConfirm(viewBooking);
                  }}
                  disabled={viewBooking.bookingStatus !== "Pending"}
                >
                  Confirm Booking
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setViewOpen(false);
                    openAssign(viewBooking, "driver");
                  }}
                >
                  Assign Driver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={viewBooking.serviceType !== "Car with Driver"}
                  onClick={() => {
                    setViewOpen(false);
                    openAssign(viewBooking, "car");
                  }}
                >
                  Assign Car
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setViewOpen(false);
                    openStatusDialog(viewBooking, "Cancelled");
                  }}
                >
                  Cancel Booking
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DrawerComponent>

      {/* Confirm Booking Dialog */}
      <Dialog
        open={confirmDialogOpen}
        title="Confirm Booking"
        onClose={() => setConfirmDialogOpen(false)}
      >
        {confirmBooking ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm this booking? It will update status to <span className="font-semibold">Confirmed</span>.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">Booking</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{confirmBooking._id ?? "—"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmDialogOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (!confirmBooking?._id) return;
                  try {
                    const res = await patchAdminBookingStatus(confirmBooking._id, "Confirmed");
                    toast.success(res?.message ?? "Booking confirmed");
                    setConfirmDialogOpen(false);
                    setStatusDialogBooking(res?.data as BookingRow);
                    setStatusDialogOpen(false);

                    // refresh
                    const data = await getAdminBookings({
                      status: statusFilter === "All" ? undefined : statusFilter,
                      search,
                    });
                    setRows(Array.isArray(data?.data) ? (data.data as BookingRow[]) : []);
                    setTotalCount(typeof data?.count === "number" ? data.count : 0);
                  } catch (e) {
                    toast.error(getAxiosErrorMessage(e as AxiosError));
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Update Booking Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        title="Update Booking Status"
        onClose={() => setStatusDialogOpen(false)}
      >
        {statusDialogBooking ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">Booking</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{statusDialogBooking._id ?? "—"}</p>
              <p className="mt-2 text-xs text-slate-600">
                Current: <span className="font-semibold">{String(statusDialogBooking.bookingStatus ?? "Pending")}</span>
              </p>
            </div>

            <div className="w-full">
              <Select
                value={statusToSet}
                onChange={(e) => setStatusToSet(e.target.value as BookingStatus)}
              >
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setStatusDialogOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant={statusToSet === "Cancelled" ? "danger" : "primary"}
                onClick={async () => {
                  if (!statusDialogBooking?._id) return;
                  try {
                    const res = await patchAdminBookingStatus(statusDialogBooking._id, statusToSet);
                    toast.success(res?.message ?? "Booking updated");
                    setStatusDialogOpen(false);

                    const data = await getAdminBookings({
                      status: statusFilter === "All" ? undefined : statusFilter,
                      search,
                    });
                    setRows(Array.isArray(data?.data) ? (data.data as BookingRow[]) : []);
                    setTotalCount(typeof data?.count === "number" ? data.count : 0);
                  } catch (e) {
                    toast.error(getAxiosErrorMessage(e as AxiosError));
                  }
                }}
              >
                Update
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Assign Driver/Car Dialog */}
      <Dialog
        open={assignDialogOpen}
        title={assignType === "driver" ? "Assign Driver" : "Assign Car"}
        onClose={() => setAssignDialogOpen(false)}
      >
        {assignBooking ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-700">Booking</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{assignBooking._id ?? "—"}</p>
              <p className="mt-2 text-xs text-slate-600">
                Select an available driver.
              </p>
            </div>

            {assignType === "driver" ? (
              <DriverAssignSection
                bookingId={assignBooking._id}
                onAssigned={() => {
                  setAssignDialogOpen(false);
                  void refreshBookings();
                }}
              />
            ) : (
              <CarAssignSection
                bookingId={assignBooking._id}
                onAssigned={() => {
                  setAssignDialogOpen(false);
                  void refreshBookings();
                }}
              />
            )}



          </div>
        ) : null}
      </Dialog>

    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

type DriverRefFromApi = {
  _id?: string;
  driverName?: string;
  experience?: number;
  phoneNumber?: string;
  status?: string;
};

// NOTE: Drivers are loaded via an authenticated request using the project's token.
// We keep this page self-contained (no backend API changes).
async function fetchAllDriversAuthenticated(): Promise<DriverRefFromApi[]> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5001/api/v1";

  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const res = await axios.get<{ success?: boolean; count?: number; data?: DriverRefFromApi[] }>(
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
  return Array.isArray(data) ? data : [];
}


function CarAssignSection({
  bookingId,
  onAssigned,
}: {
  bookingId: string | undefined;
  onAssigned: () => void;
}) {
  const [carsLoading, setCarsLoading] = useState(false);
  const [carsError, setCarsError] = useState<string | null>(null);
  const [cars, setCars] = useState<Array<{ _id?: string; carName?: string; carNumber?: string }>>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setCarsLoading(true);
        setCarsError(null);

        const res = await getAdminCars();
        const allCars = Array.isArray(res?.data) ? res.data : [];
        const availableCars = allCars.filter((c: any) => c?.isAvailable === true);

        if (!mounted) return;
        setCars(availableCars);
      } catch (e) {
        if (!mounted) return;
        setCarsError(getAxiosErrorMessage(e as AxiosError));
      } finally {
        if (!mounted) return;
        setCarsLoading(false);
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if (carsLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <LoadingSpinner />
          <span className="text-sm text-slate-600">Loading available cars…</span>
        </div>
      </div>
    );
  }

  if (carsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Could not load cars</p>
        <p className="mt-1 text-xs text-red-700">{carsError}</p>
      </div>
    );
  }

  if (!cars.length) {
    return (
      <EmptyState title="No available cars" description="All cars are currently unavailable." />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cars.map((c: any) => {
          const id = c._id ?? "";
          const name = c.carName ?? "—";
          const number = c.carNumber ?? "—";
          const selected = Boolean(id) && selectedCarId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (!id) return;
                setSelectedCarId(id);
              }}
              className={
                selected
                  ? "rounded-xl border border-slate-900 bg-slate-900 p-4 text-left text-white"
                  : "rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={selected ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900"}>
                    {name}
                  </p>
                  <p className={selected ? "mt-1 text-xs text-white/90" : "mt-1 text-xs text-slate-600"}>
                    Car Number: {number}
                  </p>
                </div>
                {selected ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-900">
                    ✓
                  </span>
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    •
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">Selected car</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCarId ? selectedCarId : "—"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onAssigned} disabled={assigning}>
          Close
        </Button>

        <Button
          type="button"
          variant="primary"
          disabled={assigning || !selectedCarId || !bookingId}
          onClick={async () => {
            if (!bookingId || !selectedCarId) return;
            try {
              setAssigning(true);
              await assignBookingDriverCar(bookingId, { carId: selectedCarId });
              toast.success("Car assigned");
              onAssigned();
            } catch (e) {
              toast.error(getAxiosErrorMessage(e as AxiosError));
            } finally {
              setAssigning(false);
            }
          }}
        >
          {assigning ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner />
              Assigning…
            </span>
          ) : (
            "Assign"
          )}
        </Button>
      </div>
    </div>
  );
}

function DriverAssignSection({
  bookingId,
  onAssigned,
}: {
  bookingId: string | undefined;
  onAssigned: () => void;
}) {

  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverRefFromApi[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);


  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setDriversLoading(true);
        setDriversError(null);

        const allDrivers = await fetchAllDriversAuthenticated();
        const available = allDrivers.filter((d) => d.status === "Available");


        if (!mounted) return;
        setDrivers(available);
      } catch (e) {
        if (!mounted) return;
        setDriversError(getAxiosErrorMessage(e as AxiosError));
      } finally {
        if (!mounted) return;
        setDriversLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
    // bookingId is not used for filtering drivers, but it is useful to re-fetch when opening another booking.
  }, [bookingId]);

  return (
    <AssignForm
      drivers={drivers}
      selectedDriverId={selectedDriverId}
      loading={driversLoading}
      error={driversError}
      onSelectDriver={(driverId) => {
        setSelectedDriverId(driverId);
      }}
      onAssign={async () => {
        if (!bookingId) {
          toast.error("Booking id missing");
          return;
        }
        if (!selectedDriverId) {
          toast.error("Select a driver");
          return;
        }
        try {
          setAssigning(true);
          await assignBookingDriverCar(bookingId, { driverId: selectedDriverId });
          toast.success("Driver assigned");
          onAssigned();
        } catch (e) {
          toast.error(getAxiosErrorMessage(e as AxiosError));
        } finally {
          setAssigning(false);
        }
      }}
      assigning={assigning}
    />
  );
}


function AssignForm({
  drivers,
  selectedDriverId,
  loading,
  error,
  onSelectDriver,
  onAssign,
  assigning,
}: {
  drivers: DriverRefFromApi[];
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string) => void;
  loading: boolean;
  error: string | null;
  onAssign: () => Promise<void> | void;
  assigning: boolean;
}) {

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <LoadingSpinner />
          <span className="text-sm text-slate-600">Loading available drivers…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Could not load drivers</p>
        <p className="mt-1 text-xs text-red-700">{error}</p>
      </div>
    );
  }

  if (!drivers.length) {
    return (
      <EmptyState
        title="No available drivers"
        description="All drivers are currently unavailable."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {drivers.map((d) => {
          const id = d._id ?? "";
          const name = d.driverName ?? "—";
          const exp = typeof d.experience === "number" ? `${d.experience} yrs` : "—";
          const phone = d.phoneNumber ?? "—";

          const selected = Boolean(id) && selectedDriverId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (!id) return;
                onSelectDriver(id);
              }}
              className={
                selected
                  ? "rounded-xl border border-slate-900 bg-slate-900 p-4 text-left text-white"
                  : "rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={selected ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900"}>
                    {name}
                  </p>
                  <p className={selected ? "mt-1 text-xs text-white/90" : "mt-1 text-xs text-slate-600"}>
                    Experience: {exp}
                  </p>
                  <p className={selected ? "mt-1 text-xs text-white/90" : "mt-1 text-xs text-slate-600"}>
                    Phone: {phone}
                  </p>
                </div>

                {selected ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-900">
                    ✓
                  </span>
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    •
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">Selected driver</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {selectedDriverId ? selectedDriverId : "—"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onAssign} disabled={assigning}>
          Close
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={assigning || !selectedDriverId}
          onClick={() => void onAssign()}
        >
          {assigning ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner />
              Assigning…
            </span>
          ) : (
            "Assign"
          )}
        </Button>
      </div>
    </div>
  );
}









