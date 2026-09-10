"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import {
  Badge,
  Button,
  Dialog,
  Drawer as DrawerComponent,
  Dropdown,
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
  id?: string;
  driverName?: string;
  phoneNumber?: string;
  experience?: number;
  status?: string;
  accountProvisioned?: boolean;
  account?: {
    id?: string;
    email?: string;
    status?: "active" | "inactive" | "blocked" | string;
  } | null;
  createdAt?: string;
};

type DeleteDriverResponse = {
  success?: boolean;
  message?: string;
  data?: {
    deleted?: boolean;
    archived?: boolean;
    emailReusable?: boolean;
  };
};

type DriverFormValues = {
  driverName: string;
  phoneNumber: string;
  experience: string; // keep as string in inputs
  status: DriverStatus;
  email: string;
  password: string;
  confirmPassword: string;
  createAccount: boolean;
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

function getDriverId(d?: Driver | null): string {
  return d?._id ?? d?.id ?? "";
}

function accountTone(status?: string): "green" | "amber" | "neutral" {
  if (status === "active") return "green";
  if (status === "inactive" || status === "blocked") return "amber";
  return "neutral";
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include uppercase, lowercase, and number characters.";
  }
  return null;
}

function validatePasswordPair(password: string, confirmPassword: string): string | null {
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;
  if (password !== confirmPassword) return "Password and confirm password do not match.";
  return null;
}

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

function MenuItem({
  children,
  tone = "default",
  onClick,
}: {
  children: ReactNode;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${
        tone === "danger"
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
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
    email: "",
    password: "",
    confirmPassword: "",
    createAccount: true,
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [secret, setSecret] = useState<{ title: string; email?: string; password: string } | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"provision" | "email" | "password" | "status">("provision");
  const [accountDriver, setAccountDriver] = useState<Driver | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountValues, setAccountValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    status: "active" as "active" | "inactive",
  });
  const [showAccountPassword, setShowAccountPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDrivers();
      setDrivers(res.data);
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
      email: "",
      password: "",
      confirmPassword: "",
      createAccount: true,
    });
    setShowFormPassword(false);
  };

  const openEdit = (d: Driver) => {
    const id = getDriverId(d) || null;
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
      email: d.account?.email ?? "",
      password: "",
      confirmPassword: "",
      createAccount: Boolean(d.accountProvisioned),
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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5001/api/v1";
    const token = localStorage.getItem("token");

    try {
      if (mode === "add") {
        const createAccount = formValues.createAccount;
        if (createAccount) {
          const email = formValues.email.trim();
          if (!email) {
            setFormError("Driver email is required to create an account.");
            setFormLoading(false);
            return;
          }
          const passwordError = validatePasswordPair(formValues.password, formValues.confirmPassword);
          if (passwordError) {
            setFormError(passwordError);
            setFormLoading(false);
            return;
          }
        }

        const passwordToShow = createAccount ? formValues.password : "";
        const res = await axios.post<{ data?: { account?: { email?: string } | null } }>(
          `${apiBaseUrl}/drivers`,
          {
            driverName: name,
            phoneNumber: phone,
            experience: expNum,
            status: formValues.status,
            createAccount,
            email: createAccount ? formValues.email.trim() : undefined,
            password: createAccount ? formValues.password : undefined,
            confirmPassword: createAccount ? formValues.confirmPassword : undefined,
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
        if (passwordToShow) {
          setSecret({ title: "Driver account created", email: res.data?.data?.account?.email, password: passwordToShow });
        }
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

  const openAccount = (d: Driver, mode: "provision" | "email" | "password" | "status") => {
    setAccountDriver(d);
    setAccountMode(mode);
    setAccountError(null);
    setAccountValues({
      email: d.account?.email ?? "",
      password: "",
      confirmPassword: "",
      status: d.account?.status === "inactive" ? "active" : "inactive",
    });
    setShowAccountPassword(false);
    setAccountOpen(true);
  };

  const submitAccount = async () => {
    const id = getDriverId(accountDriver);
    if (!id) {
      toast.error("Driver id missing");
      return;
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5001/api/v1";
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    try {
      setAccountLoading(true);
      setAccountError(null);
      if (accountMode === "provision") {
        if (!accountValues.email.trim()) throw new Error("Email is required.");
        const passwordError = validatePasswordPair(accountValues.password, accountValues.confirmPassword);
        if (passwordError) throw new Error(passwordError);
        const passwordToShow = accountValues.password;
        const res = await axios.post<{ data?: { email?: string } }>(
          `${apiBaseUrl}/drivers/${id}/account`,
          {
            email: accountValues.email.trim(),
            password: accountValues.password,
            confirmPassword: accountValues.confirmPassword,
          },
          { headers },
        );
        setSecret({ title: "Driver account set up", email: res.data?.data?.email, password: passwordToShow });
        toast.success("Driver account provisioned");
      } else if (accountMode === "email") {
        if (!accountValues.email.trim()) throw new Error("Email is required.");
        await axios.patch(`${apiBaseUrl}/drivers/${id}/account/email`, { email: accountValues.email.trim() }, { headers });
        toast.success("Driver email updated");
      } else if (accountMode === "password") {
        const passwordError = validatePasswordPair(accountValues.password, accountValues.confirmPassword);
        if (passwordError) throw new Error(passwordError);
        const passwordToShow = accountValues.password;
        const res = await axios.patch<{ data?: { email?: string } }>(
          `${apiBaseUrl}/drivers/${id}/account/password`,
          {
            password: accountValues.password,
            confirmPassword: accountValues.confirmPassword,
          },
          { headers },
        );
        setSecret({ title: "Driver password changed", email: res.data?.data?.email, password: passwordToShow });
        toast.success("Driver password changed");
      } else {
        await axios.patch(`${apiBaseUrl}/drivers/${id}/account/status`, { status: accountValues.status }, { headers });
        toast.success(`Driver account ${accountValues.status === "active" ? "activated" : "deactivated"}`);
      }
      setAccountOpen(false);
      await refresh();
    } catch (e) {
      const msg = axios.isAxiosError(e) ? getAxiosErrorMessage(e) : e instanceof Error ? e.message : "Account action failed.";
      setAccountError(msg);
      toast.error(msg);
    } finally {
      setAccountLoading(false);
    }
  };

  const confirmDelete = async () => {
    const id = getDriverId(deleteDriver);
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
      const res = await axios.delete<DeleteDriverResponse>(`${apiBaseUrl}/drivers/${id}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      const result = res.data?.data;
      const action = result?.archived ? "archived" : "deleted";
      const reuse = result?.emailReusable === false ? " Email cannot be reused." : result?.emailReusable === true ? " Email can be reused." : "";
      toast.success(`${res.data?.message || `Driver ${action}.`}${reuse}`);
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
              Manage driver profiles and admin-owned login accounts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4" colSpan={7}>
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
                    <td className="px-4 py-6" colSpan={7}>
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
                    const id = getDriverId(d);
                    const status = d.status ?? "";
                    const accountStatus = d.account?.status;
                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {d.driverName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatPhone(d.phoneNumber)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.account?.email ?? "—"}
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
                          <div className="flex flex-col gap-1">
                            <Badge tone={d.accountProvisioned ? "green" : "neutral"}>
                              {d.accountProvisioned ? "Linked" : "Unlinked"}
                            </Badge>
                            <Badge tone={accountTone(accountStatus)}>
                              {accountStatus ?? "No account"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Dropdown label="Manage">
                            <MenuItem onClick={() => openView(d)}>View</MenuItem>
                            <MenuItem onClick={() => openEdit(d)}>Edit</MenuItem>
                            {!d.accountProvisioned ? (
                              <MenuItem onClick={() => openAccount(d, "provision")}>Set Up Account</MenuItem>
                            ) : (
                              <>
                                <MenuItem onClick={() => openAccount(d, "email")}>Update Email</MenuItem>
                                <MenuItem onClick={() => openAccount(d, "password")}>Change Password</MenuItem>
                                <MenuItem onClick={() => openAccount(d, "status")}>
                                  {accountStatus === "active" ? "Deactivate" : "Activate"}
                                </MenuItem>
                              </>
                            )}
                            <MenuItem tone="danger" onClick={() => openDelete(d)}>Delete</MenuItem>
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
                <div>
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewDriver.account?.email ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Account</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {viewDriver.accountProvisioned ? `Linked (${viewDriver.account?.status ?? "unknown"})` : "Unlinked"}
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
                {!viewDriver.accountProvisioned ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setViewOpen(false); openAccount(viewDriver, "provision"); }}>
                    Set Up Account
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setViewOpen(false); openAccount(viewDriver, "password"); }}>
                    Change Password
                  </Button>
                )}
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

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formValues.createAccount}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, createAccount: e.target.checked }))}
                />
                Create login account
              </label>
              {formValues.createAccount ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                    <Input value={formValues.email} onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))} placeholder="driver@example.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
                    <Input
                      type={showFormPassword ? "text" : "password"}
                      value={formValues.password}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="At least 8 chars, upper/lower/number"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Confirm Password</label>
                    <Input
                      type={showFormPassword ? "text" : "password"}
                      value={formValues.confirmPassword}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowFormPassword((value) => !value)}>
                      {showFormPassword ? "Hide Password" : "Show Password"}
                    </Button>
                  </div>
                </div>
              ) : null}
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

      <Dialog open={accountOpen} title={accountMode === "provision" ? "Set Up Account" : accountMode === "email" ? "Update Email" : accountMode === "password" ? "Change Password" : "Update Account Status"} onClose={() => setAccountOpen(false)}>
        <div className="space-y-4">
          {accountError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">{accountError}</p>
            </div>
          ) : null}
          <p className="text-sm font-semibold text-slate-700">{accountDriver?.driverName ?? "Driver"}</p>
          {accountMode === "provision" || accountMode === "email" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
              <Input value={accountValues.email} onChange={(e) => setAccountValues((prev) => ({ ...prev, email: e.target.value }))} placeholder="driver@example.com" />
            </div>
          ) : null}
          {accountMode === "provision" || accountMode === "password" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
                <Input
                  type={showAccountPassword ? "text" : "password"}
                  value={accountValues.password}
                  onChange={(e) => setAccountValues((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 chars, upper/lower/number"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Confirm Password</label>
                <Input
                  type={showAccountPassword ? "text" : "password"}
                  value={accountValues.confirmPassword}
                  onChange={(e) => setAccountValues((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter password"
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAccountPassword((value) => !value)}>
                {showAccountPassword ? "Hide Password" : "Show Password"}
              </Button>
            </div>
          ) : null}
          {accountMode === "status" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Account Status</label>
              <Select value={accountValues.status} onChange={(e) => setAccountValues((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={accountLoading} onClick={() => setAccountOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" disabled={accountLoading} onClick={() => void submitAccount()}>
              {accountLoading ? <span className="inline-flex items-center gap-2"><LoadingSpinner />Saving…</span> : "Confirm"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={Boolean(secret)} title={secret?.title ?? "Password"} onClose={() => setSecret(null)}>
        {secret ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Copy this password now. It will not be shown again.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{secret.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">New Password</p>
              <div className="mt-1 flex items-center gap-2">
                <Input readOnly value={secret.password} type="text" />
                <Button type="button" variant="secondary" onClick={() => void navigator.clipboard.writeText(secret.password).then(() => toast.success("Password copied"))}>
                  Copy
                </Button>
              </div>
            </div>
          </div>
        ) : null}
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
                Drivers with booking or payment history will be archived instead of permanently deleted.
              </p>
              <p className="mt-2 text-xs font-semibold text-red-700">
                Driver: {deleteDriver.driverName ?? "—"}
              </p>
              <p className="mt-2 text-xs font-semibold text-red-700">
                If archived, the linked account is deactivated and its email is released for reuse. If permanently deleted, the linked account is removed and its email can be reused.
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
