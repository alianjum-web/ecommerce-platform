// app/api/auth/check-session/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookies = req.cookies;
  
  const hasRefreshToken = cookies.has('refreshToken');
  const hasAccessToken = cookies.has('accessToken');
  
  console.log("🔍 SERVER-SIDE COOKIE CHECK:");
  console.log("- All cookie names:", Array.from(cookies.getAll()));
  console.log("- Has refreshToken:", hasRefreshToken);
  console.log("- Has accessToken:", hasAccessToken);
  
  return NextResponse.json({
    hasRefreshToken,
    hasAccessToken,
    cookiesPresent: Array.from(cookies)
  });
}