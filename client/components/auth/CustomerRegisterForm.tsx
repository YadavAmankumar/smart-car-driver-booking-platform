"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import {
  Button,
  Input,
  LoadingSpinner,
} from "@/components/ui/primitives";
import AuthShell from "./AuthShell";
import AlertCard, { errorDescriptionFromUnknown } from "./AlertCard";
import { api } from "@/lib/api";
import { isSessionRole, persistSession } from "@/lib/session";
import { useRouter } from "next/navigation";

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    phone: z
      .string()
      .min(1, "Mobile number is required")
      .regex(/^[0-9+()\-\s]{6,}$/, "Enter a valid mobile number"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function CustomerRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterValues>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function validate(values: RegisterValues) {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      return {
        ok: false as const,
        issues: parsed.error.issues,
      };
    }
    return { ok: true as const, data: parsed.data };
  }

  async function onSubmit(values: RegisterValues) {
    setError(null);

    const validation = validate(values);
    if (!validation.ok) {
      const first = validation.issues[0];
      form.setError(first?.path?.[0] as keyof RegisterValues, {
        type: "manual",
        message: first?.message ?? "Invalid input",
      });
      return;
    }

    setLoading(true);
    try {
  type BackendRegisterResponse = {
        token?: string;
        user?: {
          role?: string;
        };
      };

      const res = await api.post<BackendRegisterResponse>("/auth/register", {
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        password: validation.data.password,
      });


      // Backend may or may not return token. Follow rule precisely.
      const maybeToken: string | undefined = res?.data?.token;
      const maybeUser = res?.data?.user;
      const maybeRole: string | undefined = maybeUser?.role;

      if (maybeToken && maybeUser && maybeRole === "customer" && isSessionRole(maybeRole)) {
        persistSession(maybeToken, { ...maybeUser, role: maybeRole });
        router.replace("/booking");
        return;
      }

      // Registration now requires email OTP verification.
      router.replace(
        `/verify-email?email=${encodeURIComponent(validation.data.email)}`
      );
    } catch (e) {
      const desc = errorDescriptionFromUnknown(e);
      setError({ title: "Registration failed", description: desc });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-[#EEF2FF] via-white to-white py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
          <AuthShell title="Create your account">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />

                  <Input
                    type="text"
                    placeholder="Amankumar"
                    autoComplete="name"
                    className="h-12 rounded-xl pl-10 pr-4 transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("name")}
                  />
                </div>

                {form.formState.errors.name ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Mobile Number
                </label>

                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />

                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    className="h-12 rounded-xl pl-10 pr-4 transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("phone")}
                  />
                </div>

                {form.formState.errors.phone ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>

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
                    className="h-12 rounded-xl pl-10 pr-4 transition focus:border-slate-950 focus:ring-slate-950"
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
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="h-12 rounded-xl px-4 pr-12 transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Confirm Password
                </label>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="h-12 rounded-xl px-4 pr-12 transition focus:border-slate-950 focus:ring-slate-950"
                    {...form.register("confirmPassword")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {form.formState.errors.confirmPassword ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              {error ? <AlertCard title={error.title} description={error.description} /> : null}

              <Button
                type="submit"
                className="mt-3 h-12 w-full rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-slate-800"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? <LoadingSpinner className="text-white" /> : "Register"}
              </Button>

              <p className="text-center text-sm text-[#64748B]">
                Already have an account?{" "}
                <Link className="font-semibold text-slate-950 transition hover:text-slate-600" href="/login/customer">
                  Login
                </Link>
              </p>
            </form>
          </AuthShell>
        </div>
      </div>
    </main>
  );
}
