// app/api/auth/refresh-token/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader, // Forward cookies
      },
      credentials: 'include',
    });

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // Forward cookies
    const setCookieHeader = backendRes.headers.getSetCookie();
    if (setCookieHeader && setCookieHeader.length > 0) {
      setCookieHeader.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie);
      });
    }

    return response;
  } catch (error) {
    console.error("Refresh token proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}