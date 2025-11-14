// hooks/useSilentAuth.tsx
"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function useSilentAuth() {
  const refresh = useAuthStore((s) => s.refreshAccessToken);

  useEffect(() => {
    // Only attempt refresh if we have a refresh token cookie
    const refreshToken = getCookie('refreshToken');
    if (refreshToken) {
      console.log("🔄 Attempting silent token refresh...");
      refresh().catch((e) => {
        console.debug("Silent refresh failed", e);
      });
    } else {
      console.log("🔐 No refresh token found, skipping silent auth");
    }
  }, [refresh]);
}