import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Mock API: Get shipping settings
export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/settings/shipping`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] GET /api/settings/shipping proxy failed:", err)
    return NextResponse.json({ error: "Failed to fetch shipping settings" }, { status: 502 })
  }
}

// Mock API: Update shipping settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/settings/shipping`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] PUT /api/settings/shipping proxy failed:", err)
    return NextResponse.json({ error: "Failed to update shipping settings" }, { status: 502 })
  }
}
