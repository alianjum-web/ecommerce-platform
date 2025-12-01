// app/api/auth/check-session/route.ts - PRODUCTION READY
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    
    const hasRefreshToken = cookies.has('refreshToken');
    const hasAccessToken = cookies.has('accessToken');
    
    // ✅ PROPER: Use getAll() correctly
    const allCookies = cookies.getAll();
    const cookieNames = allCookies.map(cookie => cookie.name);
    
    // In production, you might want to remove or reduce these logs
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 SERVER-SIDE COOKIE CHECK:");
      console.log("- Cookie names:", cookieNames);
      console.log("- Has refreshToken:", hasRefreshToken);
      console.log("- Has accessToken:", hasAccessToken);
    }
    
    return NextResponse.json({
      success: true,
      hasRefreshToken,
      hasAccessToken,
      cookiesPresent: cookieNames
    });
    
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        hasRefreshToken: false, 
        hasAccessToken: false,
        cookiesPresent: [] 
      },
      { status: 500 }
    );
  }
}