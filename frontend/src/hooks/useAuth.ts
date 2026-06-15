"use client";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { User, TokenResponse } from "@/types";

export function useAuth() {
  const { user, setAuth, logout, setUser } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const { isLoading: meLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
      return data;
    },
    enabled: !!user,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const { data } = await api.post<TokenResponse>("/auth/login", creds);
      return data;
    },
    onSuccess: async (tokens) => {
      const { data: me } = await api.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      setAuth(me, tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
      toast.success(`Welcome back, ${me.name}!`);
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: { email: string; name: string; password: string }) => {
      const { data } = await api.post<TokenResponse>("/auth/register", payload);
      return data;
    },
    onSuccess: async (tokens) => {
      const { data: me } = await api.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      setAuth(me, tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
      toast.success("Account created!");
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const handleLogout = () => {
    logout();
    qc.clear();
    router.push("/login");
    toast.success("Signed out");
  };

  return { user, loginMutation, registerMutation, logout: handleLogout, meLoading };
}
