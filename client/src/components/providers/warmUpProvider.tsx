// src/app/layout.tsx or src/app/providers.tsx
// "use client";

// import { useEffect } from "react";
// import { warmupService } from "@/utils/warmupService";

// export function WarmupProvider({ children }: { children: React.ReactNode }) {
//   useEffect(() => {
//     // Initialize warmup service when app starts
//     warmupService.initialize().catch(() => {});
    
//     console.log("🔥 Warmup service initialized");
//   }, []);

//   return <>{children}</>;
// }