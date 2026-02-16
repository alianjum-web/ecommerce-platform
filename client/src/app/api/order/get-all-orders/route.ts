import { API_ROUTES } from "@/utils/routes/api";
import { NextRequest, NextResponse } from "next/server";

// const BACKEND_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.BACKEND_URL
//     : process.env.DEVE_URL;

export async function POST(request: NextRequest) {
  // if (!BACKEND_URL) {
  //   return NextResponse.json(
  //     { success: false, error: "Backend URL not configured" },
  //     { status: 500 }
  //   );
  // }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const backendRes = await fetch(`${API_ROUTES.ORDER}/get-all-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Failed to to gett all the orders for admin", error);
    return NextResponse.json(
      { success: false, error: "Failed to to gett all the orders for admin" },
      { status: 500 }
    );
  }
}