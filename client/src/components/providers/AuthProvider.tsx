// app/components/AuthProvider.tsx - PRODUCTION READY
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
  const { user, initialize } = useAuthStore(); 

  useSilentAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 AuthProvider: Initializing authentication...");
        }
        
        await initialize(); 
        
      } catch (error) {
        console.error("AuthProvider: Initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [initialize]);

  const [showLoader, setShowLoader] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setShowLoader(true);
      }
    }, 300); // Show loader only after 300ms delay

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
