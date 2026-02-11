// app/api/address/get-address/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES } from "@/utils/api";
// const BACKEND_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.BACKEND_URL
//     : process.env.DEV_URL;

export async function GET(request: NextRequest) {
  // if (!BACKEND_URL) {
  //   return NextResponse.json({ success: false, error: "Backend URL not set" }, { status: 500 });
  // }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const backendRes = await fetch(`${API_ROUTES.ADDRESS}/get-address`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Fetch addresses proxy error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}
