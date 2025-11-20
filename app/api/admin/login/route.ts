import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { signAdminJWT } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/config"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Delegate verification to backend so it can use persisted admin user
    const verifyRes = await fetch(`${getApiBaseUrl()}/api/admin/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json().catch(() => ({}))
      return NextResponse.json({ success: false, message: data?.message || "Invalid credentials" }, { status: 401 })
    }

    const token = await signAdminJWT({ sub: username })

    // Set secure, httpOnly session cookie on the response (Route Handlers require setting via NextResponse)
    const res = NextResponse.json({ success: true, message: "Login successful" })
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Login failed" }, { status: 500 })
  }
}
