// app/api/warm/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TIMEOUT_MS = 10000;

export async function GET(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL || process.env.DEVE_URL;

  if (!BACKEND_URL) {
    console.error("Configuration error: BACKEND_URL not set");
    return NextResponse.json(
      {
        status: "cold",
        error: "Backend URL not configured",
      },
      { status: 500 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    console.log(`🔥 Warming up backend: ${BACKEND_URL}/api/warm`);
    
    const backendRes = await fetch(`${BACKEND_URL}/api/warm`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NextJS-Warmup-Proxy/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      console.warn(`❌ Warmup failed: ${backendRes.status}`);
      return NextResponse.json(
        {
          status: "cold",
          error: `Warmup failed with status ${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    console.log(`✅ Warmup successful: ${data.status}`);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ Warmup proxy error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          status: "cold",
          error: "Warmup timeout",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        status: "cold",
        error: "Warmup service unavailable",
      },
      { status: 503 }
    );
  }
}