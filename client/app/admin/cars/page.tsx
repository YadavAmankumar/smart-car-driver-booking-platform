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
import { createCar, deleteCar, getAdminCars, updateCar } from "@/lib/api";

type CarStatus = "Available" | "Busy";

type FuelType = "Petrol" | "Diesel" | "CNG" | "EV";

type CarRow = {
  _id?: string;
  carName?: string;
  carNumber?: string;
  carType?: FuelType | string;
  isAvailable?: boolean;
  isAC?: boolean;
};



type CarFormValues = {
  carName: string;
  carNumber: string;
  fuelType: FuelType;
  ac: "Yes" | "No";
  status: CarStatus;
};

function statusTone(status?: string): "green" | "amber" | "neutral" {
  if (status === "Available") return "green";
  if (status === "Busy") return "amber";
  return "neutral";
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
    ac: "Yes",
    status: "Available",
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);


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
      ac: isAC ? "Yes" : "No",
      status,
    });


    setFormError(null);
    setEditOpen(true);
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
        await createCar({
          carName,
          carNumber,
          carType: fuelType,
          isAvailable,
          isAC: formValues.ac === "Yes",
        });

        toast.success("Car added");
        setAddOpen(false);
      } else {
        const id = formModeCarId;
        if (!id) throw new Error("Car id missing");

        await updateCar(id, {
          carName,
          carNumber,
          carType: fuelType,
          isAvailable,
          isAC: formValues.ac === "Yes",
        });

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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Fleet (Car) Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              View, add, edit, and delete cars.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by car name, number, or fuel type"
              />
            </div>
            <Button type="button" variant="primary" onClick={openAdd}>
              Add Car
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-600">
                  <th className="px-4 py-3">Car Name</th>
                  <th className="px-4 py-3">Car Number</th>
                  <th className="px-4 py-3">Fuel Type</th>
                  <th className="px-4 py-3">AC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4" colSpan={6}>
                        <div className="flex items-center gap-3">
                          <LoadingSpinner />
                          <span className="text-sm text-slate-600">Loading cars…</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={6}>
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
                  pagedRows.map((c) => {
                    const id = c._id ?? "";
                    const status: CarStatus = c.isAvailable ? "Available" : "Busy";

                    const acLabel: "Yes" | "No" = c.isAC ? "Yes" : "No";

                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {c.carName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.carNumber ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{c.carType ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{acLabel}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(status)}>{status}</Badge>
                        </td>

                        <td className="px-4 py-3">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Car Name</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {viewCar.carName ?? "—"}
                  </p>
                </div>
                <Badge tone={statusTone(viewCar.isAvailable ? "Available" : "Busy")}>
                  {viewCar.isAvailable ? "Available" : "Busy"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Car Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewCar.carNumber ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Fuel Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewCar.carType ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">AC</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewCar.isAC ? "Yes" : "No"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewCar.isAvailable ? "Available" : "Busy"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-700">Actions</p>
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

