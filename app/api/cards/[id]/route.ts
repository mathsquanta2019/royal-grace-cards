import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// Mock API: Get single card
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${params.id}`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[API] GET /api/cards/[id] proxy failed:", err)
    return NextResponse.json({ error: "Failed to fetch card" }, { status: 502 })
  }
}

// Mock API: Update card
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${params.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[API] PATCH /api/cards/[id] proxy failed:", error)
    return NextResponse.json({ error: "Failed to update card" }, { status: 502 })
  }
}

// Mock API: Delete card
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${params.id}`, {
      method: "DELETE",
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] DELETE /api/cards/[id] proxy failed:", error)
    return NextResponse.json({ error: "Failed to delete card" }, { status: 502 })
  }
}
