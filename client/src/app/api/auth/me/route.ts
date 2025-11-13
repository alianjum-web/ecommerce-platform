// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy GET /api/auth/me  ->  BACKEND_URL/auth/me
 *
 * Requirements:
 * - Set process.env.BACKEND_URL to your backend base (e.g. https://ecommerce-platform-841i.onrender.com)
 * - Backend /auth/me must accept cookie-based auth (reads refresh/access cookies)
 *
 * Behavior:
 * - forwards the incoming cookie header to the backend so backend can read cookies
 * - returns backend response body & status to client
 * - forwards any Set-Cookie header(s) from backend to the browser so the cookie is set for the frontend domain
 */
export async function GET(req: NextRequest) {
  try {
    const backendBase = process.env.BACKEND_URL;
    if (!backendBase) {
      return NextResponse.json(
        { success: false, error: "BACKEND_URL not configured" },
        { status: 500 }
      );
    }

    const backendUrl = `${backendBase.replace(/\/$/, "")}/auth/me`;

    // Forward cookie header (so backend can read refresh/access tokens)
    const cookieHeader = req.headers.get("cookie") || "";

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        // content-type might not be necessary for GET, but keep cookies forwarded
        cookie: cookieHeader,
      },
      // do not set credentials here: this is a server-side fetch
    });

    // read text (or JSON) body
    const text = await backendRes.text();

    // create NextResponse with the same status
    const res = new NextResponse(text, { status: backendRes.status });

    // forward content-type if present
    const contentType = backendRes.headers.get("content-type");
    if (contentType) res.headers.set("content-type", contentType);

    // Forward Set-Cookie(s) if backend provided any.
    // backendRes.headers.get('set-cookie') may be a single string or multiple cookies concatenated.
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      // If backend returned multiple cookies joined by comma, try to split them.
      // Note: splitting on comma is a pragmatic approach but not 100% robust if cookie values contain commas.
      if (setCookie.includes(", ")) {
        const parts = setCookie.split(", ");
        for (const part of parts) {
          // append each Set-Cookie header separately
          res.headers.append("Set-Cookie", part);
        }
      } else {
        res.headers.set("Set-Cookie", setCookie);
      }
    }

    return res;
  } catch (err) {
    console.error("Proxy /api/auth/me error:", err);
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 });
  }
}
