// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const publicRoutes = ["/auth/register", "/auth/login"];
// const superAdminRoutes = ["/super-admin", "/super-admim/:path*"];
// const userRoutes = ["/home"];

// export async function middleware(request: NextRequest) {
//   const accessToken = request.cookies.get("accessToken")?.value;
//   const { pathname } = request.nextUrl;

//   if (accessToken) {
//     try {
//       const { payload } = await jwtVerify(
//         accessToken,
//         new TextEncoder().encode(process.env.JWT_SECRET)
//       );
//       const { role } = payload as {
//         role: string;
//       };

//       if (publicRoutes.includes(pathname)) {
//         return NextResponse.redirect(
//           new URL(
//             role === "SUPER_ADMIN" ? "/super-admin" : "/home",
//             request.url
//           )
//         );
//       }

//       if (
//         role === "SUPER_ADMIN" &&
//         userRoutes.some((route) => pathname.startsWith(route))
//       ) {
//         return NextResponse.redirect(new URL("/super-admin", request.url));
//       }
//       if (
//         role !== "SUPER_ADMIN" &&
//         superAdminRoutes.some((route) => pathname.startsWith(route))
//       ) {
//         return NextResponse.redirect(new URL("/home", request.url));
//       }

//       return NextResponse.next();
//     } catch (e) {
//       console.error("Token verification failed", e);
//       const refreshResponse = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
//         {
//           method: "POST",
//           credentials: "include",
//         }
//       );

//       if (refreshResponse.ok) {
//         const response = NextResponse.next();
//         response.cookies.set(
//           "accessToken",
//           refreshResponse.headers.get("Set-Cookie") || ""
//         );
//         return response;
//       } else {
//         //ur refresh is also failed
//         const response = NextResponse.redirect(
//           new URL("/auth/login", request.url)
//         );
//         response.cookies.delete("accessToken");
//         response.cookies.delete("refreshToken");
//         return response;
//       }
//     }
//   }

//   if (!publicRoutes.includes(pathname)) {
//     return NextResponse.redirect(new URL("/auth/login", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };


// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login"];
const superAdminRoutes = ["/super-admin", "/super-admin/:path*"];
const userRoutes = ["/home"];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // If user is trying to access a public page and already has a valid token, redirect
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const { role } = payload as { role: string };

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(role === "SUPER_ADMIN" ? "/super-admin" : "/home", request.url)
        );
      }

      // role-based redirects
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
    } catch (err) {
      // token is invalid or expired: let the client handle refresh
      // do NOT attempt server-side refresh here
      if (!publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      return NextResponse.next();
    }
  }

  // No access token and not a public route -> redirect to login
  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
