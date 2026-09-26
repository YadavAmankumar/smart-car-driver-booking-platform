"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AlertCard, { errorDescriptionFromUnknown } from "@/components/auth/AlertCard";
import { api } from "@/lib/api";
import { isSessionRole, persistSession } from "@/lib/session";
import { Button, Input, LoadingSpinner } from "@/components/ui/primitives";

type VerifyOtpResponse = {
  token?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    setError(null);
    setSuccess("");

    if (!email) {
      setError({
        title: "Verification failed",
        description: "Verification email is missing. Please register again.",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP sent to your email.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post<VerifyOtpResponse>("/auth/verify-email-otp", {
        email,
        otp,
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user || !isSessionRole(user.role)) {
        throw new Error("Email verification succeeded but the session could not be created.");
      }

      persistSession(token, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

      router.replace("/booking");
    } catch (e) {
      setError({
        title: "Verification failed",
        description: errorDescriptionFromUnknown(e),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;

    setError(null);
    setSuccess("");

    if (!email) {
      setError({
        title: "Unable to resend OTP",
        description: "Verification email is missing. Please register again.",
      });
      return;
    }

    setResending(true);

    try {
      const res = await api.post("/auth/resend-email-otp", {
        email,
      });

      setSuccess(
        res.data?.message || "A new OTP has been sent to your email."
      );
      setOtp("");
      setCooldown(60);
    } catch (e) {
      setError({
        title: "Unable to resend OTP",
        description: errorDescriptionFromUnknown(e),
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-[#EEF2FF] via-white to-white py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
          <AuthShell title="Verify your email">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit OTP sent to
                </p>

                <p className="break-all text-sm font-semibold text-slate-900">
                  {email || "your email address"}
                </p>

                <p className="text-xs text-slate-500">
                  The OTP is valid for 5 minutes.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email-otp"
                  className="text-sm font-medium text-slate-900"
                >
                  Verification Code
                </label>

                <Input
                  id="email-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-12 rounded-xl text-center text-lg tracking-[0.35em]"
                />
              </div>

              {error ? (
                <AlertCard
                  title={error.title}
                  description={error.description}
                />
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={handleVerify}
                disabled={loading || resending || otp.length !== 6}
                className="h-12 w-full rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-slate-800"
              >
                {loading ? (
                  <LoadingSpinner className="text-white" />
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-sm font-semibold text-slate-950 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend OTP in ${cooldown}s`
                      : "Resend OTP"}
                </button>
              </div>
            </div>
          </AuthShell>
        </div>
      </div>
    </main>
  );
}
