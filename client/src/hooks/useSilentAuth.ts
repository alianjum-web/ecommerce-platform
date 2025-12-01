// hooks/useSilentAuth.tsx - PRODUCTION READY
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

// TODO: token expiry consistany from the server by checking the expiresIn time -- or avoid the other cases such as the interval run if the people open app in the other tabs that can cause conflicts
export default function useSilentAuth() {
  const { refreshAccessToken, checkSession } = useAuthStore();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleTokenRefresh = async () => {
      try {
        const sessionInfo = await checkSession();

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!sessionInfo?.hasAccessToken) {
          if (process.env.NODE_ENV === "development") {
            console.log("🔐 useSilentAuth: No refresh token available");
          }
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            "⏰ useSilentAuth: Setting up token refresh monitoring..."
          );
        }

        // Conservative approach: refresh every 25 minutes
        timeoutRef.current = setTimeout(() => {
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 useSilentAuth: Scheduled token refresh...");
          }
          refreshAccessToken().catch((error) => {
            console.error("useSilentAuth: Token refresh failed:", error);
          });
        }, 55 * 60 * 1000); // 25 minutes
      } catch (error) {
        console.error("useSilentAuth: Session check failed:", error);
      }
    };

    // Initial scheduling
    scheduleTokenRefresh();

    // Fallback check every 30 minutes
    intervalRef.current = setInterval(scheduleTokenRefresh, 57 * 60 * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshAccessToken, checkSession]);
}
