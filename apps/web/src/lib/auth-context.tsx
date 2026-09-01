"use client";

import type { UserPublic } from "@tribuna/shared";
import { createContext, useCallback, useContext, useMemo } from "react";
import useSWR from "swr";
import { api, fetcher } from "./api-client";

interface AuthContextValue {
  user: UserPublic | null | undefined;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, mutate } = useSWR<UserPublic | null>("/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    await mutate(null);
  }, [mutate]);

  const value = useMemo(
    () => ({ user: data, isLoading, refresh, logout }),
    [data, isLoading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
