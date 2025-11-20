import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// GET raw product image for a card
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${id}/image`, { cache: "no-store" })
    const buf = await res.arrayBuffer()
    return new NextResponse(Buffer.from(buf), {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/octet-stream",
        "cache-control": res.headers.get("cache-control") || "no-store",
      },
    })
  } catch (err) {
    console.error(`[API] GET /api/cards/${id}/image proxy failed:`, err)
    return NextResponse.json({ error: "Failed to fetch product image" }, { status: 502 })
  }
}

// POST multipart upload for a card image. Field name: "file"
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Form field "file" is required' }, { status: 400 })
    }
    const forward = new FormData()
    forward.append("file", file, (file as any).name || `${id}.png`)
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${id}/image`, { method: "POST", body: forward as any })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[API] POST /api/cards/${id}/image proxy failed:`, err)
    return NextResponse.json({ error: "Failed to upload product image" }, { status: 502 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cards/${id}/image`, { method: "DELETE" })
    if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[API] DELETE /api/cards/${id}/image proxy failed:`, err)
    return NextResponse.json({ error: "Failed to delete product image" }, { status: 502 })
  }
}
