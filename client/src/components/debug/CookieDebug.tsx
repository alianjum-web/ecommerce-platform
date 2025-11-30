// components/CookieDebug.tsx - TEMPORARY DEBUG COMPONENT
"use client";
import { useEffect } from "react";

export function CookieDebug() {
  useEffect(() => {
    console.log("🍪 ========== COOKIE DEBUG ==========");
    console.log("Full document.cookie:", document.cookie);
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = {
          value: value,
          length: value.length,
          exists: true
        };
      }
      return acc;
    }, {} as any);
    
    console.log("Parsed cookies:", cookies);
    console.log("Has refreshToken:", !!cookies.refreshToken);
    console.log("Has accessToken:", !!cookies.accessToken);
    
    if (cookies.refreshToken) {
      console.log("Refresh token length:", cookies.refreshToken.length);
      console.log("Refresh token value (first 20 chars):", cookies.refreshToken.value.substring(0, 20) + "...");
    }
    
    console.log("=====================================");
  }, []);

  return null; // This component doesn't render anything
}