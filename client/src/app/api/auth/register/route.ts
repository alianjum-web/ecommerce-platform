// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL;
  
  // Early validation
  if (!BACKEND_URL) {
    console.error("BACKEND_URL not configured");
    return NextResponse.json(
      { success: false, error: "Service configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    
    // Validate request body
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      );
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // ✅ Essential for cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle backend errors gracefully
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({
        error: `Backend responded with ${backendRes.status}`
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Registration failed with status ${backendRes.status}` 
        },
        { status: backendRes.status }
      );
    }

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // ✅ Proper cookie handling for multiple cookies
    const setCookieHeaders = backendRes.headers.getSetCookie();
    if (setCookieHeaders?.length > 0) {
      for (const cookie of setCookieHeaders) {
        response.headers.append('Set-Cookie', cookie);
      }
      console.log(`🍪 Registered and set ${setCookieHeaders.length} cookies`);
    }

    return response;

  } catch (error: any) {
    console.error("Register proxy error:", error);
    
    // Differentiate error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: "Registration timeout - please try again" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Registration service temporarily unavailable" 
      },
      { status: 503 }
    );
  }
}