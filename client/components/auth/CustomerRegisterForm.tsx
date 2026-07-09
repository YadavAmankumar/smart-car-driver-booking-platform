"use client";

import { useState } from "react";
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

      if (maybeToken && maybeUser && maybeRole) {
        localStorage.setItem("token", maybeToken);
        localStorage.setItem("user", JSON.stringify(maybeUser));
        localStorage.setItem("role", maybeRole);
        router.replace("/booking");
        return;
      }

      // If no token is returned, redirect to customer login.
      router.replace("/login/customer");
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
          <AuthShell
            title="Create your account"
            subtitle="Join in seconds—premium rides start here."
          >
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Mobile Number</label>
                <Input
                  type="tel"
                  placeholder="+1 234 567 890"
                  autoComplete="tel"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              {error ? <AlertCard title={error.title} description={error.description} /> : null}

              <Button
                type="submit"
                className="mt-2 w-full rounded-md"
                disabled={loading || form.formState.isSubmitting}
              >
                {loading ? <LoadingSpinner className="text-white" /> : "Register"}
              </Button>

              <p className="text-center text-sm text-[#64748B]">
                Already have an account?{" "}
                <Link className="font-medium text-[#2563EB] hover:underline" href="/login/customer">
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

