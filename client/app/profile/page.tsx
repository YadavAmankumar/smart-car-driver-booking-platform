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
      <main className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Profile
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Update your customer information.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            Role: {role}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-slate-600">Loading profile…</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Tip: You can update name, email, and phone using existing APIs.
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    className="rounded-lg px-6"
                    disabled={saving || !isDirty}
                    onClick={() => void onSave()}
                  >
                    {saving ? "Saving…" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </CustomerDashboardLayout>
  );
}

