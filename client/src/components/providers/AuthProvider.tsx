// app/components/AuthProvider.tsx - OPTIMIZED
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

        // ✅ OPTIMIZED: Only check if we don't have a user
        if (!user) {
          let hasRefreshToken = false;
          try {
            const checkResponse = await fetch('/api/auth/check-session');
            const sessionData = await checkResponse.json();
            console.log("🔍 SERVER SESSION CHECK:", sessionData);
            hasRefreshToken = sessionData.hasRefreshToken;
          } catch (error) {
            console.error("Session check failed:", error);
          }

          if (hasRefreshToken) {
            console.log("🔄 Found refresh token, attempting refresh...");
            await refreshAccessToken(); // Just await, don't need success check
          } else {
            console.log("🔐 No refresh token found");
          }
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
  }, [user, refreshAccessToken]); // Only run when user state changes

  // ✅ BETTER LOADING STATE - Only show if it takes more than 500ms
  const [showLoader, setShowLoader] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setShowLoader(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  if (!isInitialized && showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}