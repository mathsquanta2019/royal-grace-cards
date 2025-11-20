import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/admin/forgot-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] POST /api/admin/forgot-password proxy failed:", err)
    return NextResponse.json({ success: false, message: "Failed to request reset" }, { status: 502 })
  }
}
