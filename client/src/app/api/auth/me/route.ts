// app/api/auth/me/route.ts - OPTIMIZED VERSION
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL;
  
  // Early return for missing config
  if (!BACKEND_URL) {
    console.error("BACKEND_URL not configured");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";
    
    // Performance: Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Cookie": cookieHeader,
        // Remove unnecessary headers for GET requests
      },
      credentials: 'include',
      signal: controller.signal, // Add timeout protection
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses efficiently
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Backend responded with ${backendRes.status}` 
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // Optimized cookie forwarding
    const setCookieHeaders = backendRes.headers.getSetCookie();
    if (setCookieHeaders?.length > 0) {
      // Use for-loop instead of forEach for slightly better performance
      for (let i = 0; i < setCookieHeaders.length; i++) {
        response.headers.append('Set-Cookie', setCookieHeaders[i]);
      }
    }

    return response;

  } catch (error) {
    console.error("Proxy /api/auth/me error:", error);
    
    // Better error differentiation
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}