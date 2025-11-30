// app/api/auth/check-session/route.ts - FIXED
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookies = req.cookies;
  
  const hasRefreshToken = cookies.has('refreshToken');
  const hasAccessToken = cookies.has('accessToken');
  
  // ✅ FIX: Properly get cookie names
  const cookieNames = Array.from(cookies.getAll().map(cookie => cookie.name));
  
  console.log("🔍 SERVER-SIDE COOKIE CHECK:");
  console.log("- All cookie names:", cookieNames);
  console.log("- Has refreshToken:", hasRefreshToken);
  console.log("- Has accessToken:", hasAccessToken);
  
  return NextResponse.json({
    hasRefreshToken,
    hasAccessToken,
    cookiesPresent: cookieNames
  });
}