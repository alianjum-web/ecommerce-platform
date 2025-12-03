// hooks/useSilentAuth.tsx - FIXED CALCULATIONS
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function useSilentAuth() {
  const { refreshAccessToken, checkSession, getTokenExpiryInfo } = useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);

  const calculateRefreshTime = useCallback(async (): Promise<number | null> => {
    try {
      // First, check if we have stored token expiry info
      const expiryInfo = getTokenExpiryInfo();
      
      if (expiryInfo) {
        if (expiryInfo.shouldRefresh) {
          return 0; // Refresh immediately
        }
        
        if (expiryInfo.timeUntilExpiry > 0) {
          // Refresh 1 minute before expiry (safety margin)
          const safetyMargin = 1 * 60 * 1000; // 1 minute
          const refreshTime = Math.max(expiryInfo.timeUntilExpiry - safetyMargin, 10000); // Min 10 seconds
          return refreshTime;
        }
      }

      // If no stored info, check session
      const sessionInfo = await checkSession();
      
      if (!sessionInfo?.hasRefreshToken) {
        return null;
      }

      // ✅ CORRECTED: Default to 12 minutes (80% of 15 minutes)
      const DEFAULT_REFRESH_TIME = 12 * 60 * 1000; // 12 minutes
      return DEFAULT_REFRESH_TIME;
      
    } catch {
      // Fallback to 10 minutes if everything fails
      return 10 * 60 * 1000;
    }
  }, [checkSession, getTokenExpiryInfo]);

  const scheduleTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    try {
      const refreshTime = await calculateRefreshTime();
      
      if (refreshTime === null) {
        if (process.env.NODE_ENV === "development") {
          console.log("🔐 useSilentAuth: No session, skipping refresh");
        }
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If refresh time is 0, refresh immediately
      if (refreshTime <= 0) {
        await performTokenRefresh();
        return;
      }

      // Schedule future refresh
      if (process.env.NODE_ENV === "development") {
        console.log(`⏰ Next refresh in ${Math.round(refreshTime / 60000)}m ${Math.round((refreshTime % 60000) / 1000)}s`);
      }

      timeoutRef.current = setTimeout(async () => {
        await performTokenRefresh();
      }, refreshTime);

    } catch (error) {
      console.error("useSilentAuth: Scheduling failed:", error);
    }
  }, [calculateRefreshTime]);

  const performTokenRefresh = async () => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 useSilentAuth: Refreshing token...");
      }
      
      const success = await refreshAccessToken();
      
      if (success) {
        retryCountRef.current = 0; // Reset retry counter on success
        // Reschedule next refresh
        setTimeout(() => scheduleTokenRefresh(), 1000);
      } else {
        // Exponential backoff for failed refreshes
        retryCountRef.current++;
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Max 30 seconds
        setTimeout(() => scheduleTokenRefresh(), backoffTime);
      }
    } catch (error) {
      console.error("useSilentAuth: Token refresh failed:", error);
      retryCountRef.current++;
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      setTimeout(() => scheduleTokenRefresh(), backoffTime);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const checkAndRefreshIfNeeded = useCallback(async () => {
    try {
      const expiryInfo = getTokenExpiryInfo();
      
      if (expiryInfo?.shouldRefresh) {
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Token needs refresh");
        }
        await performTokenRefresh();
        return;
      }

      // If no expiry info but we have session, schedule refresh
      if (!expiryInfo) {
        const sessionInfo = await checkSession();
        if (sessionInfo?.hasRefreshToken) {
          await scheduleTokenRefresh();
        }
      }
    } catch (error) {
      console.error("useSilentAuth: Session check failed:", error);
    }
  }, [checkSession, scheduleTokenRefresh, getTokenExpiryInfo, performTokenRefresh]);

  useEffect(() => {
    // Initial check
    checkAndRefreshIfNeeded();

    // Safety check every 5 minutes
    intervalRef.current = setInterval(checkAndRefreshIfNeeded, 5 * 60 * 1000);

    // Refresh when tab becomes visible (if needed)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => checkAndRefreshIfNeeded(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token_expiry' || e.key?.includes('auth-storage')) {
        setTimeout(() => checkAndRefreshIfNeeded(), 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAndRefreshIfNeeded]);

  return null; // This is a hook, doesn't render anything
}