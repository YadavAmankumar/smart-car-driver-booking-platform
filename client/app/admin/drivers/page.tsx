"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

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

import axios, { type AxiosError } from "axios";

import { getCustomerProfile, getAxiosErrorMessage } from "@/lib/api";

type DriverStatus = "Available" | "Busy";

type Driver = {
  _id?: string;
  driverName?: string;
  phoneNumber?: string;
  experience?: number;
  status?: string;
  createdAt?: string;
};

type DriverFormValues = {
  driverName: string;
  phoneNumber: string;
  experience: string; // keep as string in inputs
  status: DriverStatus;
};

function statusTone(status?: string): "green" | "amber" | "neutral" {
  if (status === "Available") return "green";
  if (status === "Busy") return "amber";
  return "neutral";
}

function toNumberOrNull(v: string): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatPhone(v?: string): string {
  return v && v.trim().length ? v : "—";
}

function formatExperience(v?: number): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return `${v} yrs`;
}

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

async function fetchDrivers(): Promise<{ data: Driver[]; count: number }> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5001/api/v1";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await axios.get<{ success?: boolean; count?: number; data?: Driver[] }>(
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
  const count = typeof res.data?.count === "number" ? res.data.count : Array.isArray(data) ? data.length : 0;
  return { data: Array.isArray(data) ? data : [], count };
}

export default function AdminDriversPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formModeDriverId, setFormModeDriverId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<DriverFormValues>({
    driverName: "",
    phoneNumber: "",
    experience: "",
    status: "Available",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDrivers();
      setDrivers(res.data);
      setTotalCount(res.count);
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

  const filteredDrivers = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return drivers;

    return drivers.filter((d) => {
      const name = d.driverName ?? "";
      const phone = d.phoneNumber ?? "";
      return (
        name.toLowerCase().includes(q) || phone.toLowerCase().includes(q)
      );
    });
  }, [drivers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredDrivers.slice(start, end);
  }, [filteredDrivers, safePage]);

  const openView = (d: Driver) => {
    setViewDriver(d);
    setViewOpen(true);
  };

  const openAdd = () => {
    setFormModeDriverId(null);
    setFormFormValuesDefault();
    setFormError(null);
    setAddOpen(true);
  };

  const setFormFormValuesDefault = () => {
    setFormValues({
      driverName: "",
      phoneNumber: "",
      experience: "",
      status: "Available",
    });
  };

  const openEdit = (d: Driver) => {
    const id = d._id ?? null;
    if (!id) {
      toast.error("Driver id missing");
      return;
    }

    setFormModeDriverId(id);
    setFormValues({
      driverName: d.driverName ?? "",
      phoneNumber: d.phoneNumber ?? "",
      experience:
        typeof d.experience === "number" ? String(d.experience) : "",
      status: (d.status === "Busy" ? "Busy" : "Available") as DriverStatus,
    });
    setFormError(null);
    setEditOpen(true);
  };

  const submitForm = async (mode: "add" | "edit") => {
    setFormLoading(true);
    setFormError(null);

    const name = formValues.driverName.trim();
    const phone = formValues.phoneNumber.trim();
    const expNum = toNumberOrNull(formValues.experience.trim());

    if (!name) {
      setFormError("Driver name is required.");
      setFormLoading(false);
      return;
    }
    if (!phone) {
      setFormError("Phone number is required.");
      setFormLoading(false);
      return;
    }
    if (expNum === null || expNum < 0) {
      setFormError("Years of experience must be a valid non-negative number.");
      setFormLoading(false);
      return;
    }

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      "http://localhost:5001/api/v1";

    const token = localStorage.getItem("token");

    try {
      if (mode === "add") {
        await axios.post(
          `${apiBaseUrl}/drivers`,
          {
            driverName: name,
            phoneNumber: phone,
            experience: expNum,
            status: formValues.status,
          },
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          },
        );
        toast.success("Driver added");
        setAddOpen(false);
      } else {
        const id = formModeDriverId;
        if (!id) throw new Error("Driver id missing");

        await axios.put(
          `${apiBaseUrl}/drivers/${id}`,
          {
            driverName: name,
            phoneNumber: phone,
            experience: expNum,
            status: formValues.status,
          },
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          },
        );
        toast.success("Driver updated");
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

  const openDelete = (d: Driver) => {
    setDeleteDriver(d);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const id = deleteDriver?._id;
    if (!id) {
      toast.error("Driver id missing");
      return;
    }

    setDeleteLoading(true);

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      "http://localhost:5001/api/v1";

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${apiBaseUrl}/drivers/${id}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      toast.success("Driver deleted");
      setDeleteOpen(false);
      setDeleteDriver(null);
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
            <h1 className="text-lg font-bold text-slate-900">Driver Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              View, add, edit, and delete drivers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone"
              />
            </div>

            <Button type="button" variant="primary" onClick={openAdd}>
              Add Driver
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-600">
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Years of Experience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4" colSpan={5}>
                        <div className="flex items-center gap-3">
                          <LoadingSpinner />
                          <span className="text-sm text-slate-600">
                            Loading drivers…
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={5}>
                      <EmptyState
                        title={error ? "Unable to load drivers" : "No drivers found"}
                        description={
                          error
                            ? "Could not fetch driver data. Try again."
                            : "Adjust your search to find drivers."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((d) => {
                    const id = d._id ?? "";
                    const status = d.status ?? "";
                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {d.driverName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatPhone(d.phoneNumber)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatExperience(d.experience)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(status)}>
                            {status || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openView(d)}
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() => openEdit(d)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => openDelete(d)}
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
            Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredDrivers.length)} of {filteredDrivers.length} drivers
          </p>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      {/* View Drawer */}
      <DrawerComponent
        open={viewOpen}
        title="Driver Details"
        onClose={() => setViewOpen(false)}
      >
        {viewDriver ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Driver Name</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {viewDriver.driverName ?? "—"}
                  </p>
                </div>
                <Badge tone={statusTone(viewDriver.status)}>
                  {viewDriver.status ?? "—"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Phone Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatPhone(viewDriver.phoneNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Years of Experience</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatExperience(viewDriver.experience)}
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
                    openEdit(viewDriver);
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
                    openDelete(viewDriver);
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
      <Dialog open={addOpen} title="Add Driver" onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">{formError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Driver Name
              </label>
              <Input
                value={formValues.driverName}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    driverName: e.target.value,
                  }))
                }
                placeholder="e.g. Rahul Verma"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Phone Number
              </label>
              <Input
                value={formValues.phoneNumber}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Years of Experience
              </label>
              <Input
                value={formValues.experience}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
                placeholder="e.g. 5"
              />
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
                    status: e.target.value as DriverStatus,
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
      <Dialog open={editOpen} title="Edit Driver" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">{formError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Driver Name
              </label>
              <Input
                value={formValues.driverName}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    driverName: e.target.value,
                  }))
                }
                placeholder="e.g. Rahul Verma"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Phone Number
              </label>
              <Input
                value={formValues.phoneNumber}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Years of Experience
              </label>
              <Input
                value={formValues.experience}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
                placeholder="e.g. 5"
              />
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
                    status: e.target.value as DriverStatus,
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
        title="Delete Driver"
        onClose={() => {
          if (deleteLoading) return;
          setDeleteOpen(false);
        }}
      >
        {deleteDriver ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                This action cannot be undone.
              </p>
              <p className="mt-2 text-xs font-semibold text-red-700">
                Driver: {deleteDriver.driverName ?? "—"}
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

