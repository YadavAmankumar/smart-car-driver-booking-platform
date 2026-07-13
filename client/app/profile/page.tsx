"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomerDashboardLayout from "@/components/customer/CustomerDashboardLayout";
import { Button, Card, CardContent, Input } from "@/components/ui/primitives";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/api";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await getCustomerProfile();
        if (!mounted) return;
        setName(res?.user?.name || "");
        setEmail(res?.user?.email || "");
        setPhone(res?.user?.phone || "");
        setRole(res?.user?.role || "customer");
      } catch {
        toast.error("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const isDirty = useMemo(() => {
    return name !== ("" as string) || email !== ("" as string) || phone !== ("" as string);
  }, [name, email, phone]);

  async function onSave() {
    if (saving) return;

    setSaving(true);
    try {
      const res = await updateCustomerProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      toast.success(res?.message || "Profile updated");
      setRole(res?.user?.role || role);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CustomerDashboardLayout>
      <main className="space-y-6">
        {/* Consistent page header */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Profile</p>
              <p className="text-xs text-slate-600">
                Manage your personal information and account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/dashboard/customer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span aria-hidden="true">←</span>
                Back
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
                  Loading profile…
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Personal Information
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Keep your details up to date.
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Customer
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Name
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Phone
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          Tip: Edit your details and save to update your customer profile.

                        </p>

                        <Button
                          type="button"
                          variant="primary"
                          className="rounded-xl px-6"
                          disabled={saving || !isDirty}
                          onClick={() => void onSave()}
                        >
                          {saving ? "Saving…" : "Edit Profile"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-slate-900">
                  Profile Actions
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Manage your account quickly.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <a
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    Edit Profile
                  </a>

                  {/* Keep existing functionality; no additional endpoints added. */}
                  <a
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    Change Password
                  </a>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </CustomerDashboardLayout>
  );
}


