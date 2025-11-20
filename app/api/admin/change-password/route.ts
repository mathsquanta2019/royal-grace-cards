import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { cookies } from "next/headers"
import { verifyAdminJWT } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Derive username from JWT cookie to avoid trusting client-provided username
    const adminSession = cookies().get("admin_session")?.value
    let username = body.username
    if (adminSession) {
      const payload = await verifyAdminJWT(adminSession)
      if (payload?.sub && typeof payload.sub === "string") {
        username = payload.sub
      }
    }
    const outgoing = { ...body, username }
    const res = await fetch(`${getApiBaseUrl()}/api/admin/change-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(outgoing),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] POST /api/admin/change-password proxy failed:", err)
    return NextResponse.json({ success: false, message: "Failed to change password" }, { status: 502 })
  }
}
