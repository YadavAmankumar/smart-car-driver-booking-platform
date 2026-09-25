"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { type AxiosError } from "axios";


import {
  Badge,
  Button,
  Dialog,
  Drawer as DrawerComponent,
  EmptyState,
  Input,
  LoadingSpinner,
  Pagination,
  Select,
} from "@/components/ui/primitives";

import { getCustomerProfile, getAxiosErrorMessage } from "@/lib/api";
import {
  createCar,
  deleteCar,
  getAdminCars,
  updateCar,
  uploadCarImage,
  deleteCarImage,
} from "@/lib/api";

type CarStatus = "Available" | "Reserved" | "Busy";

type FuelType = "Petrol" | "Diesel" | "CNG" | "EV";
type VehicleCategory = "Mini" | "Sedan" | "XL – 7 Seater" | "Force Traveller";

type CarSchedule = {
  _id?: string;
  bookingDate?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingStatus?: string;
  serviceType?: string;
  estimatedHours?: number;
  estimatedKm?: number;
  estimatedDuration?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  driver?: {
    _id?: string;
    driverName?: string;
    phoneNumber?: string;
    experience?: number;
  } | null;
};

type CarRow = {
  _id?: string;
  carName?: string;
  carNumber?: string;
  carType?: FuelType | string;
  vehicleCategory?: VehicleCategory;
  isAvailable?: boolean;
  isAC?: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  schedule?: CarSchedule[];
};



type CarFormValues = {
  carName: string;
  carNumber: string;
  fuelType: FuelType;
  vehicleCategory: VehicleCategory;
  ac: "Yes" | "No";
  status: CarStatus;
};

function statusTone(status?: string): "green" | "amber" | "neutral" {
  if (status === "Available") return "green";
  if (status === "Busy") return "amber";
  if (status === "Reserved") return "neutral";
  return "neutral";
}

function getBookingStart(booking: CarSchedule): Date | null {
  if (!booking.bookingDate || !booking.pickupTime) return null;

  const datePart = booking.bookingDate.slice(0, 10);
  const timePart = booking.pickupTime.length === 5
    ? `${booking.pickupTime}:00`
    : booking.pickupTime;

  const date = new Date(`${datePart}T${timePart}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCarStatus(car: CarRow): CarStatus {
  const schedule = Array.isArray(car.schedule) ? car.schedule : [];

  if (schedule.some((booking) => booking.bookingStatus === "Ongoing")) {
    return "Busy";
  }

  const now = new Date();

  const hasUpcomingBooking = schedule.some((booking) => {
    if (!["Pending", "Confirmed"].includes(booking.bookingStatus ?? "")) {
      return false;
    }

    const start = getBookingStart(booking);
    return start ? start >= now : false;
  });

  if (hasUpcomingBooking) return "Reserved";

  return car.isAvailable ? "Available" : "Busy";
}

function getNextCarBooking(car: CarRow): CarSchedule | null {
  const now = new Date();

  const upcoming = (car.schedule ?? [])
    .filter((booking) => {
      if (!["Pending", "Confirmed"].includes(booking.bookingStatus ?? "")) {
        return false;
      }

      const start = getBookingStart(booking);
      return start ? start >= now : false;
    })
    .sort((a, b) => {
      const aStart = getBookingStart(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bStart = getBookingStart(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aStart - bStart;
    });

  return upcoming[0] ?? null;
}



function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

export default function AdminCarsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cars, setCars] = useState<CarRow[]>([]);


  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewCar, setViewCar] = useState<CarRow | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formModeCarId, setFormModeCarId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CarFormValues>({
    carName: "",
    carNumber: "",
    fuelType: "Petrol",
    vehicleCategory: "Sedan",
    ac: "Yes",
    status: "Available",
  });

  const [selectedCarImage, setSelectedCarImage] = useState<File | null>(null);
  const [carImagePreview, setCarImagePreview] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCarRow, setDeleteCarRow] = useState<CarRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCars();
      const data = Array.isArray(res?.data) ? (res.data as CarRow[]) : [];
      setCars(data);

    } catch (e) {
      const msg = getAxiosErrorMessage(e as AxiosError);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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

        await refresh();
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
  }, []);


  const filteredCars = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return cars;

    return cars.filter((c) => {
      const name = c.carName ?? "";
      const number = c.carNumber ?? "";
      const fuel = c.carType ?? "";
      return (
        name.toLowerCase().includes(q) ||
        number.toLowerCase().includes(q) ||
        String(fuel).toLowerCase().includes(q)
      );
    });
  }, [cars, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredCars.slice(start, end);
  }, [filteredCars, safePage]);

  const openView = (car: CarRow) => {
    setViewCar(car);
    setViewOpen(true);
  };

  const resetForm = () => {
    setFormValues({
      carName: "",
      carNumber: "",
      fuelType: "Petrol",
      vehicleCategory: "Sedan",
      ac: "Yes",
      status: "Available",
    });
  };

  const openAdd = () => {
    setFormModeCarId(null);
    resetForm();
    setFormError(null);
    setAddOpen(true);
  };

  const openEdit = (car: CarRow) => {
    const id = car._id ?? null;
    if (!id) {
      toast.error("Car id missing");
      return;
    }

    setFormModeCarId(id);

    const isAvailable = Boolean(car.isAvailable);
    const status: CarStatus = isAvailable ? "Available" : "Busy";

    // Backend field mapping: carController uses `carType` + `isAvailable`.
    // There is no AC field in the backend controller; we still must show AC.
    // For UI, we derive AC from `isAvailable` only if needed; otherwise default.
    // Keep UX consistent: default AC = Yes.
    const isAC = car.isAC !== false;

    setFormValues({
      carName: car.carName ?? "",
      carNumber: car.carNumber ?? "",
      fuelType:
        (String(car.carType) as FuelType) === "Petrol" ||
        (String(car.carType) as FuelType) === "Diesel" ||
        (String(car.carType) as FuelType) === "CNG" ||
        (String(car.carType) as FuelType) === "EV"
          ? (car.carType as FuelType)
          : "Petrol",
      vehicleCategory:
        car.vehicleCategory === "Mini" ||
        car.vehicleCategory === "Sedan" ||
        car.vehicleCategory === "XL – 7 Seater" ||
        car.vehicleCategory === "Force Traveller"
          ? car.vehicleCategory
          : "Sedan",
      ac: isAC ? "Yes" : "No",
      status,
    });


    setSelectedCarImage(null);
    setCarImagePreview(car.imageUrl ?? null);
    setFormError(null);
    setEditOpen(true);
  };

  const handleCarImageChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Car image must be 10 MB or smaller.");
      return;
    }

    setSelectedCarImage(file);
    setCarImagePreview(URL.createObjectURL(file));
    setFormError(null);
  };

  const clearCarImageSelection = () => {
    setSelectedCarImage(null);
    setCarImagePreview(null);
  };

  const handleDeleteCarImage = async () => {
    const id = formModeCarId;

    if (!id) {
      setFormError("Car id missing.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      await deleteCarImage(id);

      setSelectedCarImage(null);
      setCarImagePreview(null);

      toast.success("Car image deleted");
      await refresh();
    } catch (e) {
      const msg = getAxiosErrorMessage(e as AxiosError);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const submitForm = async (mode: "add" | "edit") => {
    setFormLoading(true);
    setFormError(null);

    const carName = formValues.carName.trim();
    const carNumber = formValues.carNumber.trim();
    const fuelType = formValues.fuelType;
    const isAvailable = formValues.status === "Available";

    if (!carName) {
      setFormError("Car name is required.");
      setFormLoading(false);
      return;
    }

    if (!carNumber) {
      setFormError("Car number is required.");
      setFormLoading(false);
      return;
    }

    // Backend Car model (from controller) does not accept AC explicitly.
    // It accepts carType + isAvailable.
    // We keep UI AC input but do not send it to backend to avoid backend schema/business changes.

    try {
      if (mode === "add") {
        const createResponse = await createCar({
          carName,
          carNumber,
          carType: fuelType,
          vehicleCategory: formValues.vehicleCategory,
          isAvailable,
          isAC: formValues.ac === "Yes",
        });

        const createdCarId = createResponse?.data?._id;

        if (selectedCarImage && createdCarId) {
          await uploadCarImage(createdCarId, selectedCarImage);
        }

        toast.success("Car added");
        setAddOpen(false);
      } else {
        const id = formModeCarId;
        if (!id) throw new Error("Car id missing");

        await updateCar(id, {
          carName,
          carNumber,
          carType: fuelType,
          vehicleCategory: formValues.vehicleCategory,
          isAvailable,
          isAC: formValues.ac === "Yes",
        });

        if (selectedCarImage) {
          await uploadCarImage(id, selectedCarImage);
        }

        toast.success("Car updated");
        setEditOpen(false);
      }

      await refresh();
    } catch (e) {
      const msg = getAxiosErrorMessage(e as AxiosError);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (car: CarRow) => {
    setDeleteCarRow(car);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const id = deleteCarRow?._id;
    if (!id) {
      toast.error("Car id missing");
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteCar(id);
      toast.success("Car deleted");
      setDeleteOpen(false);
      setDeleteCarRow(null);
      await refresh();
    } catch (e) {
      const msg = getAxiosErrorMessage(e as AxiosError);
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="w-full px-6 py-6">
      <section className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                <span className="text-lg">🚘</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Car Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage cars, assignments, availability, and upcoming trips.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="border-[#0F172A] bg-[#0F172A] text-white shadow-sm hover:border-black hover:bg-black"
            onClick={openAdd}
          >
            Add Car
          </Button>
        </div>

        {/* Fleet Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Cars
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {cars.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registered in fleet
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Available
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {cars.filter((car) => getCarStatus(car) === "Available").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ready for assignment
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Busy
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {cars.filter((car) => getCarStatus(car) === "Busy").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Currently on trip
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Reserved
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {cars.filter((car) => getCarStatus(car) === "Reserved").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upcoming assignments
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xl">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus:border-[#0F172A] focus:ring-[#0F172A]/10"
                placeholder="Search by car name, number, or fuel type"
              />
            </div>

            <p className="text-sm text-slate-500">
              Showing {filteredCars.length} car{filteredCars.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-4 py-4">#</th>
                  <th className="min-w-[210px] px-4 py-4">Car Details</th>
                  <th className="px-4 py-4">Car Number</th>
                  <th className="px-4 py-4">Fuel Type</th>
                  <th className="px-4 py-4">Vehicle Category</th>
                  <th className="px-4 py-4">AC</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="min-w-[250px] px-4 py-4">
                    Current / Upcoming Trip
                  </th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4" colSpan={9}>
                        <div className="flex items-center gap-3">
                          <LoadingSpinner />
                          <span className="text-sm text-slate-600">Loading cars…</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={9}>
                      <EmptyState
                        title={error ? "Unable to load cars" : "No cars found"}
                        description={
                          error
                            ? "Could not fetch car data. Try again."
                            : "Adjust your search to find cars."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((c, index) => {
                    const id = c._id ?? "";
                    const status = getCarStatus(c);
                    const nextBooking = getNextCarBooking(c);

                    const acLabel: "Yes" | "No" = c.isAC ? "Yes" : "No";

                    return (
                      <tr
                        key={id}
                        className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4 align-middle text-xs font-semibold text-slate-400">
                          {(safePage - 1) * pageSize + index + 1}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                              <img
                                src={c.imageUrl || "/images/smartdrive-car.png"}
                                alt={c.carName || "Car"}
                                className="h-full w-full object-contain"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-950">
                                {c.carName ?? "Unnamed Car"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {c.isAC ? "Air Conditioned" : "Non-AC"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <p className="text-sm font-semibold text-slate-800">
                            {c.carNumber ?? "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {c.carType ?? "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {c.vehicleCategory ?? "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                              acLabel === "Yes"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {acLabel}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <Badge tone={statusTone(status)}>{status}</Badge>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          {nextBooking ? (
                            <div className="max-w-[280px] space-y-1.5">
                              {nextBooking.driver?.driverName ? (
                                <p className="text-sm font-semibold text-slate-800">
                                  {nextBooking.driver.driverName}
                                </p>
                              ) : (
                                <p className="text-sm font-medium text-slate-500">
                                  Driver not assigned
                                </p>
                              )}

                              {nextBooking.bookingDate && nextBooking.pickupTime ? (
                                <p className="text-xs font-medium text-slate-500">
                                  {nextBooking.bookingDate.slice(0, 10)}
                                  {" · "}
                                  {nextBooking.pickupTime}
                                </p>
                              ) : null}

                              {nextBooking.pickupLocation ? (
                                <p className="truncate text-xs text-slate-400">
                                  {nextBooking.pickupLocation}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No upcoming trip
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openView(c)}
                            >
                              View
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              className="border-[#0F172A] bg-[#0F172A] text-white hover:border-black hover:bg-black"
                              onClick={() => openEdit(c)}
                            >
                              Edit
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => openDelete(c)}
                            >
                              Delete
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
            Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredCars.length)} of {filteredCars.length} cars
          </p>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      {/* View Drawer */}
      <DrawerComponent
        open={viewOpen}
        title="Car Details"
        onClose={() => setViewOpen(false)}
      >
        {viewCar ? (
          <div className="space-y-4">
            {(() => {
              const viewStatus = getCarStatus(viewCar);
              const currentBooking =
                (viewCar.schedule ?? []).find(
                  (booking) => booking.bookingStatus === "Ongoing"
                ) ?? null;
              const nextBooking = getNextCarBooking(viewCar);
              const assignment = currentBooking ?? nextBooking;

              return (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Car Name
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {viewCar.carName ?? "—"}
                        </p>
                      </div>

                      <Badge tone={statusTone(viewStatus)}>
                        {viewStatus}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Car Number
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewCar.carNumber ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Fuel Type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewCar.carType ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Vehicle Category
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewCar.vehicleCategory ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          AC
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewCar.isAC ? "Yes" : "No"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold text-slate-700">
                      {currentBooking
                        ? "Current Assignment"
                        : nextBooking
                          ? "Next Assignment"
                          : "Assignment"}
                    </p>

                    {assignment ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Driver
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {assignment.driver?.driverName ?? "Not assigned"}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Pickup Date
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {assignment.bookingDate?.slice(0, 10) ?? "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Pickup Time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {assignment.pickupTime ?? "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Pickup Location
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {assignment.pickupLocation ?? "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Drop Location
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {assignment.dropLocation ?? "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Booking Status
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {assignment.bookingStatus ?? "—"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No current or upcoming car assignment.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold text-slate-700">
                      Actions
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setViewOpen(false);
                          openEdit(viewCar);
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setViewOpen(false);
                          openDelete(viewCar);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </DrawerComponent>

      {/* Add Dialog */}
      <Dialog open={addOpen} title="Add Car" onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">{formError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Name
              </label>
              <Input
                value={formValues.carName}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, carName: e.target.value }))
                }
                placeholder="e.g. Sedan LX"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Number
              </label>
              <Input
                value={formValues.carNumber}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    carNumber: e.target.value,
                  }))
                }
                placeholder="e.g. MH12 AB 1234"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Image
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {carImagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={carImagePreview}
                      alt="Car preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                        Choose Different Image
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) =>
                            handleCarImageChange(e.target.files?.[0])
                          }
                        />
                      </label>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={clearCarImageSelection}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center hover:bg-slate-50">
                    <span className="text-sm font-semibold text-slate-800">
                      Upload Car Image
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Choose from device or use camera
                    </span>
                    <span className="mt-3 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">
                      Choose Image
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        handleCarImageChange(e.target.files?.[0])
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Fuel Type
              </label>
              <Select
                value={formValues.fuelType}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    fuelType: e.target.value as FuelType,
                  }))
                }
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Vehicle Category
              </label>
              <Select
                value={formValues.vehicleCategory}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    vehicleCategory: e.target.value as VehicleCategory,
                  }))
                }
              >
                <option value="Mini">Mini</option>
                <option value="Sedan">Sedan</option>
                <option value="XL – 7 Seater">XL – 7 Seater</option>
                <option value="Force Traveller">Force Traveller</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                AC
              </label>
              <Select
                value={formValues.ac}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    ac: e.target.value as "Yes" | "No",
                  }))
                }
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Status
              </label>
              <Select
                value={formValues.status}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    status: e.target.value as CarStatus,
                  }))
                }
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void submitForm("add")}
              disabled={formLoading}
            >
              {formLoading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Adding…
                </span>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} title="Edit Car" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">{formError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Name
              </label>
              <Input
                value={formValues.carName}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, carName: e.target.value }))
                }
                placeholder="e.g. Sedan LX"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Number
              </label>
              <Input
                value={formValues.carNumber}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    carNumber: e.target.value,
                  }))
                }
                placeholder="e.g. MH12 AB 1234"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Car Image
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {carImagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={carImagePreview}
                      alt="Car preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) =>
                            handleCarImageChange(e.target.files?.[0])
                          }
                        />
                      </label>

                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDeleteCarImage}
                        disabled={formLoading}
                      >
                        Delete Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center hover:bg-slate-50">
                    <span className="text-sm font-semibold text-slate-800">
                      No Car Image
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Choose an image from your device or use camera
                    </span>
                    <span className="mt-3 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">
                      Choose Image
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        handleCarImageChange(e.target.files?.[0])
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Fuel Type
              </label>
              <Select
                value={formValues.fuelType}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    fuelType: e.target.value as FuelType,
                  }))
                }
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Vehicle Category
              </label>
              <Select
                value={formValues.vehicleCategory}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    vehicleCategory: e.target.value as VehicleCategory,
                  }))
                }
              >
                <option value="Mini">Mini</option>
                <option value="Sedan">Sedan</option>
                <option value="XL – 7 Seater">XL – 7 Seater</option>
                <option value="Force Traveller">Force Traveller</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                AC
              </label>
              <Select
                value={formValues.ac}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    ac: e.target.value as "Yes" | "No",
                  }))
                }
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Status
              </label>
              <Select
                value={formValues.status}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    status: e.target.value as CarStatus,
                  }))
                }
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void submitForm("edit")}
              disabled={formLoading}
            >
              {formLoading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        title="Delete Car"
        onClose={() => {
          if (deleteLoading) return;
          setDeleteOpen(false);
        }}
      >
        {deleteCarRow ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                This action cannot be undone.
              </p>
              <p className="mt-2 text-xs font-semibold text-red-700">
                Car: {deleteCarRow.carName ?? "—"} ({deleteCarRow.carNumber ?? "—"})
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={deleteLoading}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteLoading}
                onClick={() => void confirmDelete()}
              >
                {deleteLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner />
                    Deleting…
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </main>
  );
}

