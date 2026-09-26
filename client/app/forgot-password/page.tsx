"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import AuthShell from "@/components/auth/AuthShell";
import AlertCard from "@/components/auth/AlertCard";
import { Button, Input, LoadingSpinner } from "@/components/ui/primitives";
import {
  forgotPassword,
  getAxiosErrorMessage,
  verifyResetOtp,
} from "@/lib/api";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit OTP"),
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const emailForm = useForm<EmailValues>({
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpValues>({
    defaultValues: {
      otp: "",
    },
  });

  async function sendResetOtp(values: EmailValues) {
    setError(null);

    const validation = emailSchema.safeParse(values);

    if (!validation.success) {
      emailForm.setError("email", {
        type: "manual",
        message:
          validation.error.issues[0]?.message ?? "Enter a valid email address",
      });
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(validation.data.email);
      setSubmittedEmail(validation.data.email);
      otpForm.reset();
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function resendResetOtp() {
    if (!submittedEmail) return;

    setError(null);
    setResending(true);

    try {
      await forgotPassword(submittedEmail);
      otpForm.reset();
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp(values: OtpValues) {
    setError(null);

    const validation = otpSchema.safeParse(values);

    if (!validation.success) {
      otpForm.setError("otp", {
        type: "manual",
        message: validation.error.issues[0]?.message ?? "Invalid OTP",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyResetOtp(
        submittedEmail,
        validation.data.otp,
      );

      if (!response.resetToken) {
        throw new Error("Reset token was not returned. Please try again.");
      }

      sessionStorage.setItem(
        "smartdrive_reset_token",
        response.resetToken,
      );
      sessionStorage.setItem(
        "smartdrive_reset_email",
        submittedEmail,
      );

      window.location.assign("/reset-password");
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <AuthShell
        title="Verify OTP"
        subtitle="Enter the 6-digit OTP sent to your customer account email."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Email
            </label>

            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <Input
                type="email"
                value={submittedEmail}
                disabled
                className="h-12 rounded-xl bg-slate-50 pl-10 pr-4 text-sm text-slate-600 sm:text-base"
              />
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={otpForm.handleSubmit(verifyOtp)}
            noValidate
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Verification OTP
              </label>

              <div className="relative">
                <ShieldCheck
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="h-12 rounded-xl pl-10 pr-4 text-sm tracking-[0.25em] sm:text-base"
                  {...otpForm.register("otp")}
                />
              </div>

              {otpForm.formState.errors.otp ? (
                <p className="text-xs text-red-600">
                  {otpForm.formState.errors.otp.message}
                </p>
              ) : null}
            </div>

            {error ? (
              <AlertCard
                title="Password reset failed"
                description={error}
              />
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800"
              disabled={loading || resending}
            >
              {loading ? (
                <LoadingSpinner className="text-white" />
              ) : (
                "Verify OTP"
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Need to start again?{" "}
              <button
                type="button"
                onClick={resendResetOtp}
                disabled={resending || loading}
                className="font-semibold text-slate-950 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending ? "Sending..." : "Request a new OTP"}
              </button>
            </p>
          </form>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your customer account email and we'll send you a password reset OTP."
    >
      <form
        className="space-y-5"
        onSubmit={emailForm.handleSubmit(sendResetOtp)}
        noValidate
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">
            Email
          </label>

          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <Input
              type="email"
              placeholder="amankumar@example.com"
              autoComplete="email"
              className="h-12 rounded-xl pl-10 pr-4 text-sm sm:text-base"
              {...emailForm.register("email")}
            />
          </div>

          {emailForm.formState.errors.email ? (
            <p className="text-xs text-red-600">
              {emailForm.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        {error ? (
          <AlertCard title="Password reset failed" description={error} />
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner className="text-white" />
          ) : (
            "Send Reset OTP"
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            href="/login/customer"
            className="font-semibold text-slate-950 hover:text-slate-600"
          >
            Back to Customer Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
