import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Mock API: Get all cards
export async function GET() {
  try {
    const base = getApiBaseUrl()
    const upstream = `${base}/api/cards`
    const res = await fetch(upstream, {
      // Next.js edge/runtime fetch options; ensure no caching for freshness
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error(`[API] GET /api/cards upstream ${upstream} returned ${res.status}`)
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] GET /api/cards proxy failed:", err)
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/cards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[API] POST /api/cards proxy failed:", error)
    return NextResponse.json({ error: "Failed to create card" }, { status: 502 })
  }
}
