// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  
  console.log("🔧 Login proxy called");
  console.log("🌐 Backend URL:", BACKEND_URL);
  
  if (!BACKEND_URL) {
    console.error("❌ Backend URL not configured");
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    console.log("📦 Request body received");

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Add this
    });

    console.log("✅ Backend response status:", backendRes.status);
    
    // Get the response data
    const responseData = await backendRes.json();
    
    // Create response
    const response = NextResponse.json(responseData, { 
      status: backendRes.status 
    });

    // Forward ALL set-cookie headers from backend
    const setCookieHeader = backendRes.headers.getSetCookie();
    if (setCookieHeader && setCookieHeader.length > 0) {
      console.log("🍪 Setting cookies from backend:", setCookieHeader);
      setCookieHeader.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie);
      });
    }

    return response;
  } catch (error) {
    console.error("❌ Login proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}