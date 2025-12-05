// app/api/auth/refresh-token/route.ts - CORRECTED
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Token refresh service unavailable",
  TIMEOUT: "Refresh token timeout",
} as const;

const TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.NODE_ENV === "production" 
    ? process.env.BACKEND_URL 
    : process.env.DEVE_URL;

  if (!BACKEND_URL) {
    console.error("Configuration error: BACKEND_URL not set");
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.BACKEND_NOT_CONFIGURED,
        code: "CONFIG_ERROR",
      },
      { status: 500 }
    );
  }

  try {
     const refreshCookie = req.cookies.get("refreshToken")?.value;

  console.log("🔍 refreshCookie:", typeof refreshCookie !== "undefined");

  if (!refreshCookie) {
    return NextResponse.json(
      { success: false, error: "No refresh token available", code: "NO_REFRESH_TOKEN" },
      { status: 401 }
    );
  }
    

    // console.log("✅ Refresh token found, length:", cookies.refreshToken?.length);

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: refreshCookie, // Forward original cookies
        "User-Agent": "NextJS-Auth-Proxy/1.0",
        // Optional: You can also send just the refresh token
        // "X-Refresh-Token": cookies.refreshToken
      },
      credentials: "include",
      signal: controller.signal,
    });

    console.log("🔧 Backend Response:", {
      status: backendRes.status,
      statusText: backendRes.statusText,
      ok: backendRes.ok,
      url: `${BACKEND_URL}/api/auth/refresh-token`,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error("❌ Backend error response:", {
        status: backendRes.status,
        errorText: errorText.substring(0, 200),
        headers: Object.fromEntries(backendRes.headers.entries()),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Token refresh failed",
          code: `REFRESH_FAILED_${backendRes.status}`,
          debug: {
            backendStatus: backendRes.status,
            backendResponse: errorText.substring(0, 200),
          }
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    console.log("✅ Token refresh successful:", {
      hasAccessToken: !!responseData.accessToken,
      hasTokenInfo: !!responseData.tokenInfo,
    });

    const enhancedData = {
      ...responseData,
      tokenInfo: {
        accessTokenExpiresIn: responseData.tokenInfo?.accessTokenExpiresIn ?? 15 * 60,
        refreshTokenExpiresIn: responseData.tokenInfo?.refreshTokenExpiresIn ?? 7 * 24 * 60 * 60,
        refreshedAt: responseData.tokenInfo?.refreshedAt ?? new Date().toISOString(),
        suggestedRefreshTime: responseData.tokenInfo?.suggestedRefreshTime ?? 12 * 60,
        proxied: true,
        proxyTimestamp: new Date().toISOString(),
      },
    };

    const response = NextResponse.json(enhancedData, {
      status: backendRes.status,
    });

    // Forward cookies from backend
    const setCookieHeaders = backendRes.headers.getSetCookie?.() || [];
    console.log(`🍪 Backend Set-Cookie headers count:`, setCookieHeaders.length);
    
    if (setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
        console.log("   Set-Cookie:", cookie.substring(0, 80) + (cookie.length > 80 ? "..." : ""));
      }
    }

    return response;

  } catch (error: any) {
    console.error("❌ Refresh token proxy error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.TIMEOUT,
          code: "TIMEOUT",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}