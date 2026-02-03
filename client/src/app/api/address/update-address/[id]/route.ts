// app/api/address/update-address/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL
    : process.env.DEV_URL;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!BACKEND_URL) {
    return NextResponse.json({ success: false, error: "Backend URL not set" }, { status: 500 });
  }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/address/update-address/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Update address proxy error:", err);
    return NextResponse.json({ success: false, error: "Failed to update address" }, { status: 500 });
  }
}
