import { API_ROUTES } from "@/utils/routes/api";
import { NextRequest, NextResponse } from "next/server";

// const BACKEND_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.BACKEND_URL
//     : process.env.DEVE_URL;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // if (!BACKEND_URL) {
  //   return NextResponse.json(
  //     { success: false, error: "BACKEND URL is not configured" },
  //     { status: 500 },
  //   );
  // }

  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken)
      return NextResponse.json(
        { success: true, error: "Unauthenticated" },
        { status: 401 },
      );

      const { id } = await request.json()

      const backendRes = await fetch(`${API_ROUTES.ORDER}/order/${id}`,{
        method: "GET", 
        headers: {
            "Content-Type": "application/json", 
            "Cookie": `accessToken=${accessToken}; refreshToken=${refreshToken}`
        },
      } );

      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status })

  } catch (error) {
    console.log(
      "Error getting user's single order details",
      error,
    );
    return NextResponse.json(
      { success: false, error: "Error getting user's order details" },
      { status: 500 },
    );
  }
}
