// app/api/auth/refresh-token/route.ts - ENHANCED DEBUGGING
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ERROR_MESSAGES = {
  BACKEND_NOT_CONFIGURED: "Backend URL not configured",
  SERVICE_UNAVAILABLE: "Token refresh service unavailable",
  TIMEOUT: "Refresh token timeout",
} as const;

const TIMEOUT_MS = 8000; // 8 seconds for token refresh

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL || process.env.DEVE_URL;

  if (!BACKEND_URL) {
    console.error("Configuration error: BACKEND_URL not set for refresh token");
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
    const cookieHeader = req.headers.get("cookie") || "";

    // 🔍 DEBUG: Log what cookies we're receiving
    console.log("🍪 Received cookies:", {
      hasRefreshToken: cookieHeader.includes("refreshToken"),
      hasAccessToken: cookieHeader.includes("accessToken"),
      cookieLength: cookieHeader.length,
      cookies: cookieHeader.split(";").map((c) => c.trim()),
    });

    // Validate that we have necessary cookies
    if (!cookieHeader.includes("refreshToken")) {
      return NextResponse.json(
        {
          success: false,
          error: "No refresh token available",
          code: "NO_REFRESH_TOKEN",
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
        Cookie: cookieHeader,
        "User-Agent": "NextJS-Auth-Proxy/1.0",
      },
      credentials: "include",
      signal: controller.signal,
    });

    console.log("🔧 Backend refresh response:", {
      status: backendRes.status,
      statusText: backendRes.statusText,
      ok: backendRes.ok,
    });

    clearTimeout(timeoutId);

    // Handle backend errors
    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = {
          error: `Backend refresh failed with ${backendRes.status}`,
        };
      }

      console.warn(`Token refresh failed: ${backendRes.status}`, {
        status: backendRes.status,
        hasCookies: !!cookieHeader,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Token refresh failed`,
          code: `REFRESH_FAILED_${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    if (backendRes.ok) {
      const responseData = await backendRes.json();

      // ✅ ENSURE tokenInfo always exists with correct values
      const enhancedData = {
        ...responseData,
        tokenInfo: {
          // Use backend tokenInfo if available, otherwise use defaults
          accessTokenExpiresIn:
            responseData.tokenInfo?.accessTokenExpiresIn ?? 15 * 60,
          refreshTokenExpiresIn:
            responseData.tokenInfo?.refreshTokenExpiresIn ?? 7 * 24 * 60 * 60,
          refreshedAt:
            responseData.tokenInfo?.refreshedAt ?? new Date().toISOString(),
          suggestedRefreshTime:
            responseData.tokenInfo?.suggestedRefreshTime ?? 12 * 60,
          // Add proxy metadata for debugging
          proxied: true,
          proxyTimestamp: new Date().toISOString(),
        },
      };

      const response = NextResponse.json(enhancedData, {
        status: backendRes.status,
      });

      // ✅ Using for...of for better performance
      const setCookieHeaders = backendRes.headers.getSetCookie();
      console.log(`🍪 Backend Set-Cookie headers:`, setCookieHeaders);

      if (setCookieHeaders?.length > 0) {
        console.log(
          `🔄 Token refresh successful, forwarding ${setCookieHeaders.length} cookies`
        );

        for (const cookie of setCookieHeaders) {
          response.headers.append("Set-Cookie", cookie);
          console.log("   Appended:", cookie.substring(0, 80) + "...");
        }
      } else {
        console.log("🔍 No Set-Cookie headers from backend");
      }

      // Add security headers
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      return response;
    }
  } catch (error: any) {
    console.error("Refresh token proxy error:", error);

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
