// hooks/useSilentAuth.tsx - SMART VERSION
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

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export default function useSilentAuth() {
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const scheduleTokenRefresh = () => {
      const accessToken = getCookie('accessToken');
      const refreshToken = getCookie('refreshToken');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!refreshToken) {
        console.log("🔐 No refresh token available");
        return;
      }

      const expiry = getTokenExpiry(accessToken);
      const now = Date.now();

      if (expiry) {
        const timeUntilExpiry = expiry - now;
        
        // Only refresh if token expires within 5 minutes
        if (timeUntilExpiry <= 5 * 60 * 1000) {
          console.log("🔄 Token expiring soon, refreshing...");
          refreshAccessToken().catch(error => {
            console.error("Token refresh failed:", error);
          });
        } else {
          // Schedule refresh for 1 minute before expiry
          const refreshTime = timeUntilExpiry - (60 * 1000); // 1 minute before expiry
          console.log(`⏰ Scheduling token refresh in ${Math.round(refreshTime/1000/60)} minutes`);
          
          timeoutRef.current = setTimeout(() => {
            refreshAccessToken().catch(error => {
              console.error("Scheduled token refresh failed:", error);
            });
          }, Math.max(refreshTime, 0)); // Ensure positive time
        }
      } else {
        // If we can't read token expiry, do a safe refresh every 30 minutes
        console.log("⏰ Cannot read token expiry, safe refresh in 30 minutes");
        timeoutRef.current = setTimeout(() => {
          refreshAccessToken().catch(error => {
            console.error("Safe token refresh failed:", error);
          });
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    // Initial scheduling
    scheduleTokenRefresh();

    // Also set up a fallback check every hour for edge cases
    const fallbackInterval = setInterval(scheduleTokenRefresh, 60 * 60 * 1000); // 1 hour

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(fallbackInterval);
    };
  }, [refreshAccessToken]);
}