// app/api/auth/refresh-token/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL!;
  const cookieHeader = req.headers.get("cookie") || "";

  const backendRes = await fetch(`${backendUrl}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
  });

  const text = await backendRes.text();
  const res = new NextResponse(text, { status: backendRes.status });

  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) res.headers.set("Set-Cookie", setCookie);

  const contentType = backendRes.headers.get("content-type");
  if (contentType) res.headers.set("content-type", contentType);

  return res;
}
