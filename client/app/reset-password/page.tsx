"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import AuthShell from "@/components/auth/AuthShell";
import AlertCard from "@/components/auth/AlertCard";
import { Button, Input, LoadingSpinner } from "@/components/ui/primitives";
import { getAxiosErrorMessage, resetPassword } from "@/lib/api";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const token = sessionStorage.getItem("smartdrive_reset_token");

    if (!token) {
      router.replace("/forgot-password");
      return;
    }

    setResetToken(token);
    setCheckingToken(false);
  }, [router]);

  async function handleResetPassword(values: ResetPasswordValues) {
    setError(null);

    const validation = resetPasswordSchema.safeParse(values);

    if (!validation.success) {
      const issue = validation.error.issues[0];

      if (issue?.path[0] === "confirmPassword") {
        form.setError("confirmPassword", {
          type: "manual",
          message: issue.message,
        });
      } else {
        form.setError("newPassword", {
          type: "manual",
          message: issue?.message ?? "Invalid password",
        });
      }

      return;
    }

    if (!resetToken) {
      setError("Your password reset session has expired. Please request a new OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(
        resetToken,
        validation.data.newPassword,
      );

      if (!response.success) {
        throw new Error(response.message ?? "Password reset failed");
      }

      setSuccess(true);

      sessionStorage.removeItem("smartdrive_reset_token");
      sessionStorage.removeItem("smartdrive_reset_email");

      setTimeout(() => {
        router.replace("/login/customer");
      }, 1500);
    } catch (e) {
      setSuccess(false);
      setError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (checkingToken) {
    return (
      <AuthShell
        title="Reset password"
        subtitle="Preparing your secure password reset."
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        title="Password reset successful"
        subtitle="Your customer account password has been updated."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            Your password has been reset successfully. Redirecting you to
            Customer Login...
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Set a new password for your SmartDrive customer account."
    >
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(handleResetPassword)}
        noValidate
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">
            New Password
          </label>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              className="h-12 rounded-xl pl-10 pr-11 text-sm sm:text-base"
              {...form.register("newPassword")}
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={
                showNewPassword ? "Hide new password" : "Show new password"
              }
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {form.formState.errors.newPassword ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">
            Confirm Password
          </label>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="h-12 rounded-xl pl-10 pr-11 text-sm sm:text-base"
              {...form.register("confirmPassword")}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.confirmPassword.message}
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
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner className="text-white" />
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
