"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";

import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import {
  Button,
  Checkbox,
  Input,
  LoadingSpinner,
} from "@/components/ui/primitives";
import AuthShell from "./AuthShell";
import AlertCard, { errorDescriptionFromUnknown } from "./AlertCard";
import { getAxiosErrorMessage } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginValues = z.infer<typeof loginSchema>;

export default function LoginFormBase({
  title,
  subtitle,
  actionLabel,
  role,
  showRememberMe,
  onLogin,
  registerHref,
}: {
  title: string;
  subtitle?: string;
  actionLabel: string;
  role: "customer" | "driver" | "admin";
  showRememberMe?: boolean;
  registerHref?: string;
  onLogin: (values: LoginValues) => Promise<void>;
}) {

  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function validate(values: LoginValues) {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      return {
        ok: false as const,
        issues: parsed.error.issues,
      };
    }
    return { ok: true as const, data: parsed.data };
  }

  async function submit(values: LoginValues) {
    setError(null);

    const validation = validate(values);
    if (!validation.ok) {
      // Map first issue to field-level message via form's internal state.
      // Keep UI consistent with the existing error rendering.
      form.setError(validation.issues[0]?.path?.[0] as keyof LoginValues, {
        type: "manual",
        message: validation.issues[0]?.message ?? "Invalid input",
      });
      return;
    }

    setLoading(true);
    try {
      await onLogin(validation.data);
    } catch (e) {
      const msg = errorDescriptionFromUnknown(e);
      const axMsg = getAxiosErrorMessage(e);
      const title =
        axMsg.toLowerCase().includes("invalid") ||
        axMsg.toLowerCase().includes("credentials")
          ? "Invalid credentials"
          : "Login failed";
      setError({ title, description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-[#EEF2FF] via-white to-white py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
          <AuthShell title={title} subtitle={subtitle}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(submit)}
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
                    className="h-12 min-w-0 rounded-xl pl-10 pr-4 text-sm sm:text-base transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("email")}
                  />
                </div>

                {form.formState.errors.email ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Password
                </label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete={
                      role === "admin" ? "new-password" : "current-password"
                    }
                    className="h-12 rounded-xl px-4 pr-12 transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {form.formState.errors.password ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              {showRememberMe ? (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#334155]">
                    <Checkbox {...form.register("rememberMe")} />
                    Remember Me
                  </label>
                  <span className="text-xs text-[#94A3B8]">
                    Forgot password
                    <span className="ml-1 rounded-md bg-[#E2E8F0] px-2 py-1">
                      disabled
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">
                    Forgot password
                    <span className="ml-1 rounded-md bg-[#E2E8F0] px-2 py-1">
                      disabled
                    </span>
                  </span>
                </div>
              )}

              {error ? <AlertCard title={error.title} description={error.description} /> : null}

              <Button
                type="submit"
                className="mt-3 h-12 w-full rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-slate-800"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? <LoadingSpinner className="text-white" /> : actionLabel}
              </Button>

              {registerHref ? (
                <p className="text-center text-sm text-[#64748B]">
                  Don&apos;t have an account?{" "}
                  <Link className="font-semibold text-slate-950 transition hover:text-slate-600" href={registerHref}>
                    Register
                  </Link>
                </p>
              ) : null}
            </form>
          </AuthShell>
        </div>
      </div>
    </main>
  );
}

