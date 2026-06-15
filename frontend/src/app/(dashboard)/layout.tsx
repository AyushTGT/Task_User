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

  useEffect(() => {
    if (_hasHydrated && !user) router.push("/login");
  }, [user, _hasHydrated, router]);

  // Show nothing until Zustand has restored state from localStorage
  if (!_hasHydrated) return null;
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
