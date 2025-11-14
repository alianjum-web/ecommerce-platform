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
    });

    console.log("✅ Backend response status:", backendRes.status);
    
    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // Forward set-cookie headers from backend
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      console.log("🍪 Setting cookies from backend");
      response.headers.set("Set-Cookie", setCookie);
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