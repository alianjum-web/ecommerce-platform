import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;

  const cookieHeader = req.headers.get("cookie") || "";

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       cookie: cookieHeader,
    },
  });

  const text = await backendRes.text();
  const res = new NextResponse(text, { status: backendRes.status });

  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) res.headers.set("Set-Cookie", setCookie);

  return res;
}
