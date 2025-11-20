import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Orders API proxy to Spring Boot backend
export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders`, { cache: "no-store" })
    const data = await res.json().catch(() => ([]))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] GET /api/orders proxy failed:", err)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 502 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] POST /api/orders proxy failed:", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 })
  }
}
