// app/components/AuthProvider.tsx
"use client";

import React, { useEffect } from "react";
import useSilentAuth from "@/hooks/useSilentAuth";

export default function AuthProvider({ children }: { children: React.ReactNode }) { 
  useSilentAuth();
  return <>{children}</>
}