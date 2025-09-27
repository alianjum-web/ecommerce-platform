import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login"];
const superAdminRoutes = ["/super-admin", "/super-admim/:path*"];
const userRoutes = ["/home"];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const { role } = payload as {
        role: string;
      };

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "SUPER_ADMIN" ? "/super-admin" : "/home",
            request.url
          )
        );
      }

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Token verification failed", e);
      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (refreshResponse.ok) {
        const response = NextResponse.next();
        response.cookies.set(
          "accessToken",
          refreshResponse.headers.get("Set-Cookie") || ""
        );
        return response;
      } else {
        //ur refresh is also failed
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
  }

  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};


/*
// middleware.ts (Frontend - Simplified)
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = ['/auth/login', '/auth/register']
const superAdminRoutes = ['/super-admin', '/super-admin/:path*']
const userRoutes = ['/home']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value
  const userRole = request.cookies.get('userRole')?.value // Set this during login

  // Redirect to login if no token and accessing protected route
  if (!accessToken && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect away from auth pages if already logged in
  if (accessToken && publicRoutes.includes(pathname)) {
    const redirectPath = userRole === 'SUPER_ADMIN' ? '/super-admin' : '/home'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Role-based redirection (using cookie value, not JWT verification)
  if (accessToken && userRole) {
    if (userRole === 'SUPER_ADMIN' && pathname.startsWith('/home')) {
      return NextResponse.redirect(new URL('/super-admin', request.url))
    }
    if (userRole !== 'SUPER_ADMIN' && pathname.startsWith('/super-admin')) {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
*/