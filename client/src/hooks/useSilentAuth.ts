// hooks/useSilentAuth.tsx
"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function useSilentAuth() {
  const refresh = useAuthStore((s) => s.refreshAccessToken);

  useEffect(() => {
    // fire-and-forget: refresh will call /api/auth/refresh (proxy) then /me
    refresh().catch((e) => {
      // swallow errors silently; app can show login screen if guest
      console.debug("Silent refresh failed", e);
    });
  }, [refresh]);
}
