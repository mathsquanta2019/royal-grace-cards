import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Mock API: Update order
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const updates = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(updates),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] PATCH /api/orders/[id] proxy failed:", err)
    return NextResponse.json({ error: "Failed to update order" }, { status: 502 })
  }
}

// Mock API: Get single order
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders/${id}`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] GET /api/orders/[id] proxy failed:", err)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 502 })
  }
}

// Mock API: Delete order
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders/${id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("[API] DELETE /api/orders/[id] proxy failed:", err)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 502 })
  }
}
