import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Proxy to backend: create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/payment/stripe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[API] POST /api/payment/stripe proxy failed:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 502 })
  }
}

// Not supported by backend
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 405 })
}
