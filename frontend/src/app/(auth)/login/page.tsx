"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Zap, ChevronDown, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const SUPER_ADMIN_EMAIL = "superadmin@taskflow.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin123!";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fillSuperAdmin = () => {
    setValue("email", SUPER_ADMIN_EMAIL);
    setValue("password", SUPER_ADMIN_PASSWORD);
    setShowSuperAdmin(false);
  };

  const onSubmit = (data: FormData) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-violet-300 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">TaskFlow</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage tasks<br />like a pro.
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed">
              Kanban boards, real-time updates, team collaboration — everything you need to ship faster.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tasks tracked", value: "10k+" },
              { label: "Teams using it", value: "500+" },
              { label: "Uptime", value: "99.9%" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-brand-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-brand-300 text-sm">
          © 2024 TaskFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[rgb(var(--bg))]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[rgb(var(--text))] font-bold text-lg">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[rgb(var(--text))]">Welcome back</h2>
            <p className="text-[rgb(var(--text-muted))] mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@company.com"
                className={cn("input", errors.email && "border-red-500 focus:ring-red-500/40")}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn("input pr-10", errors.password && "border-red-500 focus:ring-red-500/40")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full h-11 text-base"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-muted))]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Create one free
            </Link>
          </p>

          {/* Super admin collapsible */}
          <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSuperAdmin(!showSuperAdmin)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Login as Super Admin
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showSuperAdmin && "rotate-180")} />
            </button>
            {showSuperAdmin && (
              <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-950/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[rgb(var(--text-muted))]">Email</span>
                  <code className="font-mono text-amber-700 dark:text-amber-400">{SUPER_ADMIN_EMAIL}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[rgb(var(--text-muted))]">Password</span>
                  <code className="font-mono text-amber-700 dark:text-amber-400">{SUPER_ADMIN_PASSWORD}</code>
                </div>
                <button
                  type="button"
                  onClick={fillSuperAdmin}
                  className="mt-1 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
                >
                  Use these credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
