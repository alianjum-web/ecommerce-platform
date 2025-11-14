// hooks/useSilentAuth.tsx - FIXED VERSION
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function isTokenExpiredOrExpiring(token: string | null): boolean {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expiry <= (now + fiveMinutes);
  } catch {
    return true;
  }
}

export default function useSilentAuth() {
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const accessToken = getCookie('accessToken');
      const refreshToken = getCookie('refreshToken');
      
      if (!refreshToken) {
        console.log("🔐 No refresh token available");
        return;
      }

      // Check if access token is expired or about to expire
      if (isTokenExpiredOrExpiring(accessToken)) {
        console.log("🔄 Access token needs refresh");
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error("Silent refresh failed:", error);
        }
      }
    };

    // Check immediately on mount
    checkAndRefreshToken();

    // Set up interval to check every 30 seconds
    refreshIntervalRef.current = setInterval(checkAndRefreshToken, 30000);

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshAccessToken]);
}