// hooks/useSilentAuth.tsx - FIXED VERSION
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

// ✅ CHECK COOKIES VIA SERVER API
async function checkServerSession() {
  try {
    const response = await fetch('/api/auth/check-session');
    const data = await response.json();
    return {
      hasRefreshToken: data.hasRefreshToken,
      hasAccessToken: data.hasAccessToken
    };
  } catch (error) {
    console.error("Server session check failed:", error);
    return { hasRefreshToken: false, hasAccessToken: false };
  }
}

export default function useSilentAuth() {
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
  
  // ✅ FIX: Properly type the useRef
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleTokenRefresh = async () => {
      // ✅ USE SERVER-SIDE CHECK INSTEAD OF document.cookie
      const sessionInfo = await checkServerSession();
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!sessionInfo.hasRefreshToken) {
        console.log("🔐 No refresh token available");
        return;
      }

      console.log("⏰ Setting up token refresh monitoring...");
      
      // Conservative approach: refresh every 25 minutes
      timeoutRef.current = setTimeout(() => {
        console.log("🔄 Scheduled token refresh...");
        refreshAccessToken().catch(error => {
          console.error("Scheduled token refresh failed:", error);
        });
      }, 25 * 60 * 1000); // 25 minutes
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
  }, [refreshAccessToken]);
}