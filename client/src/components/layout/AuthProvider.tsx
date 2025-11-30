// app/components/AuthProvider.tsx - FIXED VERSION
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import useSilentAuth from "@/hooks/useSilentAuth";

// ✅ BETTER COOKIE DETECTION FUNCTION
function hasRefreshToken(): boolean {
  if (typeof document === 'undefined') return false;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  console.log("🍪 ALL COOKIES:", cookies);
  console.log("🔍 Refresh token present:", !!cookies.refreshToken);
  console.log("🔍 Access token present:", !!cookies.accessToken);
  
  return !!cookies.refreshToken;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, fetchMe, refreshAccessToken } = useAuthStore();

  useSilentAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing authentication...");

        // ✅ USE IMPROVED COOKIE DETECTION
        const hasRefreshTokenCookie = hasRefreshToken();

        if (hasRefreshTokenCookie && !user) {
          console.log("🔄 Found refresh token, attempting refresh...");
          const refreshSuccess = await refreshAccessToken();
          
          if (!refreshSuccess) {
            console.log("❌ Token refresh failed, trying to fetch user directly...");
            await fetchMe();
          }
        } else if (!hasRefreshTokenCookie) {
          console.log("🔐 No refresh token found in cookies");
          console.log("📋 Available cookies:", document.cookie);
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
  }, [user, fetchMe, refreshAccessToken]);

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