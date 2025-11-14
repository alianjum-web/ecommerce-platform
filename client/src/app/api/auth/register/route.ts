// app/api/auth/register/route.ts
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
    const body = await req.text();
    
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = await backendRes.json();
    const response = NextResponse.json(responseData, { status: backendRes.status });

    // Forward set-cookie headers if any
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("Set-Cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("Register proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}