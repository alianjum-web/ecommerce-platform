import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL
    : process.env.DEVE_URL;

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 }
    );
  }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    console.log("🛒 Proxying cart fetch to backend...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
console.log(`This is the url: ${BACKEND_URL}`)
    const backendRes = await fetch(`${BACKEND_URL}/api/cart/fetch-cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await backendRes.json();

    if (!backendRes.ok) {
      console.warn(`Cart fetch failed: ${backendRes.status}`);
      return NextResponse.json(data, { status: backendRes.status });
    }

    console.log("✅ Cart fetched successfully");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Cart fetch proxy error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}