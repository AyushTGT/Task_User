"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();

  useWebSocket(accessToken);

  // Fallback: persist.onRehydrateStorage doesn't reliably fire in Next.js App Router
  // production builds, so we manually trigger _hasHydrated via Zustand's persist API.
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.setState({ _hasHydrated: true });
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        useAuthStore.setState({ _hasHydrated: true });
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated && !user) router.push("/login");
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated) return (
    <div className="flex h-screen items-center justify-center bg-[rgb(var(--bg))]">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[rgb(var(--bg))]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
