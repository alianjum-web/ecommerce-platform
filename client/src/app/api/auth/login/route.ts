import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await backendRes.text();

  const res = new NextResponse(text, {
    status: backendRes.status,
  });
  
  const setCookie = req.headers.get("set-cookie");
  if (setCookie) {
    res.headers.set("Set-Cookie", setCookie);
  }

  const contentType = backendRes.headers.get("Content-Type");
  if (contentType) res.headers.set("Content-Type", contentType);
  return res;
}
