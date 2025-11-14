// app/api/auth/refresh-token/route.ts - PRODUCTION READY
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Token refresh service unavailable",
  TIMEOUT: "Refresh token timeout",
} as const;

const TIMEOUT_MS = 8000; // 8 seconds for token refresh

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL;
  
  if (!BACKEND_URL) {
    console.error("Configuration error: BACKEND_URL not set for refresh token");
    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.BACKEND_NOT_CONFIGURED,
        code: "CONFIG_ERROR"
      },
      { status: 500 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    // Validate that we have necessary cookies
    if (!cookieHeader.includes('refreshToken')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No refresh token available",
          code: "NO_REFRESH_TOKEN"
        },
        { status: 401 }
      );
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
        "User-Agent": "NextJS-Auth-Proxy/1.0",
      },
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle backend errors
    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Backend refresh failed with ${backendRes.status}` };
      }

      console.warn(`Token refresh failed: ${backendRes.status}`, {
        status: backendRes.status,
        hasCookies: !!cookieHeader
      });

      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Token refresh failed`,
          code: `REFRESH_FAILED_${backendRes.status}`
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // ✅ Using for...of for better performance
    const setCookieHeaders = backendRes.headers.getSetCookie();
    if (setCookieHeaders?.length > 0) {
      console.log(`🔄 Token refresh successful, forwarding ${setCookieHeaders.length} cookies`);
      
      for (const cookie of setCookieHeaders) {
        response.headers.append('Set-Cookie', cookie);
      }
    }

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;

  } catch (error: any) {
    console.error("Refresh token proxy error:", error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: ERROR_MESSAGES.TIMEOUT,
          code: "TIMEOUT"
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        code: "SERVICE_UNAVAILABLE"
      },
      { status: 503 }
    );
  }
}