// app/components/AuthProvider.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) { 
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, fetchMe, refreshAccessToken } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing authentication...");
        
        // First, try to refresh token if we have cookies but no user
        const hasRefreshToken = document.cookie.includes('refreshToken');
        
        if (hasRefreshToken && !user) {
          console.log("🔄 Found refresh token, attempting refresh...");
          const refreshSuccess = await refreshAccessToken();
          
          if (!refreshSuccess) {
            console.log("❌ Token refresh failed, trying to fetch user directly...");
            await fetchMe();
          }
        } else if (!user) {
          console.log("🔐 No existing session, skipping auth initialization");
        }
        
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [user, fetchMe, refreshAccessToken]);

  // Optional: Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}