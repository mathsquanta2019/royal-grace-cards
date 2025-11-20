import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminJWT } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    // Public admin routes (no auth required)
    const publicAdminPaths = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"])
    if (publicAdminPaths.has(pathname)) {
      return NextResponse.next()
    }
    // Check for admin session cookie
    const adminSession = request.cookies.get("admin_session")?.value

    // If no session and not on allowed public pages, redirect to login
    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (adminSession) {
      // Verify JWT; if invalid, clear and redirect to login
      const payload = await verifyAdminJWT(adminSession)
      if (!payload) {
        const loginUrl = new URL("/admin/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        const res = NextResponse.redirect(loginUrl)
        res.cookies.set("admin_session", "", { path: "/", maxAge: 0 })
        return res
      }
      // If valid and on login page, redirect to dashboard
      if (pathname === "/admin/login") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}
