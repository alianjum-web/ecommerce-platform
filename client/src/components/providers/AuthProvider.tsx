// app/components/AuthProvider.tsx - FIXED VERSION
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import useSilentAuth from "@/hooks/useSilentAuth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, refreshAccessToken } = useAuthStore();

  useSilentAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing authentication...");

        // ✅ CHECK COOKIES VIA SERVER API (CAN READ HttpOnly COOKIES)
        let hasRefreshToken = false;
        try {
          const checkResponse = await fetch('/api/auth/check-session');
          const sessionData = await checkResponse.json();
          console.log("🔍 SERVER SESSION CHECK:", sessionData);
          hasRefreshToken = sessionData.hasRefreshToken;
        } catch (error) {
          console.error("Session check failed:", error);
        }

        if (hasRefreshToken && !user) {
          console.log("🔄 Found refresh token (server-side), attempting refresh...");
          const refreshSuccess = await refreshAccessToken();
          
          if (!refreshSuccess) {
            console.log("❌ Token refresh failed");
          }
        } else if (!hasRefreshToken) {
          console.log("🔐 No refresh token found (server-side check)");
        } else {
          console.log("✅ User already authenticated");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [user, refreshAccessToken]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  return <>{children}</>;
}