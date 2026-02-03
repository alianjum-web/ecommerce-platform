import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL
    : process.env.DEV_URL;

export async function POST(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 500 },
    );
  }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const backendRes = await fetch(
      `${BACKEND_URL}/api/address/add-address`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.log("create address proxy errr:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add address" },
      { status: 500 },
    );
  }
}
