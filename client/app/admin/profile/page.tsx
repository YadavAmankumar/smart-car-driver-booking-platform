"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, CardContent, Input } from "@/components/ui/primitives";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/lib/api";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const res = await getCustomerProfile();

        if (!mounted) return;

        if (res?.user?.role !== "admin") {
          window.location.href =
            res?.user?.role === "driver"
              ? "/driver/dashboard"
              : "/dashboard";
          return;
        }

        setName(res?.user?.name || "");
        setEmail(res?.user?.email || "");
        setPhone(res?.user?.phone || "");
      } catch {
        if (mounted) {
          toast.error("Failed to load admin profile");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    if (saving) return;

    setSaving(true);

    try {
      const res = await updateCustomerProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      toast.success(res?.message || "Profile updated");

      if (res?.user) {
        setName(res.user.name || "");
        setEmail(res.user.email || "");
        setPhone(res.user.phone || "");

        const rawUser = localStorage.getItem("user");

        if (rawUser) {
          try {
            const storedUser = JSON.parse(rawUser);

            localStorage.setItem(
              "user",
              JSON.stringify({
                ...storedUser,
                name: res.user.name,
                email: res.user.email,
                phone: res.user.phone,
                role: res.user.role,
              })
            );
          } catch {
            // Keep existing localStorage value if it cannot be parsed.
          }
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update profile";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-6xl p-6 md:p-8">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  Admin Profile
                </p>

                <h1 className="text-2xl font-extrabold text-slate-950">
                  Manage Your Profile
                </h1>

                <p className="text-sm text-slate-600">
                  View and update your administrator account information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  {loading ? (
                    <div className="py-8 text-sm text-slate-600">
                      Loading admin profile...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Personal Information
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Update the information associated with your admin
                            account.
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          Administrator
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Name
                          </label>

                          <Input
                            value={name}
                            onChange={(event) =>
                              setName(event.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Email
                          </label>

                          <Input
                            type="email"
                            value={email}
                            onChange={(event) =>
                              setEmail(event.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Phone
                          </label>

                          <Input
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                              setPhone(event.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-slate-100 pt-5">
                        <Button
                          type="button"
                          variant="primary"
                          className="rounded-xl px-6"
                          disabled={saving}
                          onClick={() => void handleSave()}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-slate-900">
                    Account
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Account Type
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        Administrator
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Access
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        Admin Dashboard
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </main>
  );
}
