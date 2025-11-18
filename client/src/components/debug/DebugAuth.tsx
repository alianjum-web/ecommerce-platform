// components/DebugAuth.tsx - Add this to your login page
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function DebugAuth() {
  const { user, isLoading, error } = useAuthStore();

  useEffect(() => {
    console.log("🔄 DEBUG - Auth State Changed:", {
      user,
      isLoading,
      error,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    });
  }, [user, isLoading, error]);

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded text-xs max-w-xs z-50">
      <div className="font-bold">DEV DEBUG</div>
      <div>User: {user ? user.email : "NULL"}</div>
      <div>Loading: {isLoading ? "YES" : "NO"}</div>
      <div>Error: {error || "NO ERROR"}</div>
    </div>
  );
}