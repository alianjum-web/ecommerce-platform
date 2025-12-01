// hooks/useSilentAuth.tsx - PRODUCTION READY
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function useSilentAuth() {
  const { refreshAccessToken, checkSession } = useAuthStore(); // ✅ Use store methods
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleTokenRefresh = async () => {
      try {
        // ✅ USE STORE METHOD instead of direct API call
        const sessionInfo = await checkSession();
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!sessionInfo?.hasRefreshToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log("🔐 useSilentAuth: No refresh token available");
          }
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log("⏰ useSilentAuth: Setting up token refresh monitoring...");
        }
        
        // Conservative approach: refresh every 25 minutes
        timeoutRef.current = setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log("🔄 useSilentAuth: Scheduled token refresh...");
          }
          refreshAccessToken().catch(error => {
            console.error("useSilentAuth: Token refresh failed:", error);
          });
        }, 25 * 60 * 1000); // 25 minutes
        
      } catch (error) {
        console.error("useSilentAuth: Session check failed:", error);
      }
    };

    // Initial scheduling
    scheduleTokenRefresh();

    // Fallback check every 30 minutes
    intervalRef.current = setInterval(scheduleTokenRefresh, 30 * 60 * 1000);

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
  }, [refreshAccessToken, checkSession]); // ✅ Add dependencies
}