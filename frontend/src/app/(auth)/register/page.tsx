"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Zap, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const features = [
  "Unlimited tasks & projects",
  "Kanban board with drag & drop",
  "Real-time collaboration",
  "File attachments & activity log",
  "Dark mode included",
];

export default function RegisterPage() {
  const { registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = ({ name, email, password }: FormData) =>
    registerMutation.mutate({ name, email, password });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-700 via-brand-700 to-brand-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-brand-300 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TaskFlow</span>
        </div>
        <div className="relative space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Start for free.<br />Ship faster.
            </h1>
            <p className="text-brand-200 text-lg">Everything you need to manage tasks like a senior engineer.</p>
          </div>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-brand-300 text-sm">© 2024 TaskFlow. Free forever.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[rgb(var(--bg))]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[rgb(var(--text))]">Create your account</h2>
            <p className="text-[rgb(var(--text-muted))] mt-1">Get started in seconds — no credit card required.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input {...register("name")} type="text" placeholder="Jane Smith" className={cn("input", errors.name && "border-red-500")} autoComplete="name" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input {...register("email")} type="email" placeholder="jane@company.com" className={cn("input", errors.email && "border-red-500")} autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className={cn("input pr-10", errors.password && "border-red-500")} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input {...register("confirmPassword")} type="password" placeholder="Repeat password" className={cn("input", errors.confirmPassword && "border-red-500")} autoComplete="new-password" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full h-11 text-base mt-2">
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create free account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-muted))]">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
