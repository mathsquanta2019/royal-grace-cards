import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

// GET raw QR image for a method (zelle|venmo|cashapp)
export async function GET(_: NextRequest, { params }: { params: { method: string } }) {
  const { method } = params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/payment/qr-codes/${method}`, {
      // avoid caching at edge; backend sets cache headers
      cache: "no-store",
    })
    const buf = await res.arrayBuffer()
    // Forward content type and status
    return new NextResponse(Buffer.from(buf), {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/octet-stream",
        "cache-control": res.headers.get("cache-control") || "no-store",
        "last-modified": res.headers.get("last-modified") || "",
      },
    })
  } catch (err) {
    console.error(`[API] GET /api/payment/qr-codes/${method} proxy failed:`, err)
    return NextResponse.json({ error: "Failed to fetch QR code" }, { status: 502 })
  }
}

// POST multipart upload for a method. Expects form field "file"
export async function POST(request: NextRequest, { params }: { params: { method: string } }) {
  const { method } = params
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Form field "file" is required' }, { status: 400 })
    }

    const forward = new FormData()
    forward.append("file", file, (file as any).name || `${method}.png`)

    const res = await fetch(`${getApiBaseUrl()}/api/payment/qr-codes/${method}`, {
      method: "POST",
      body: forward as any,
      // fetch will auto set multipart boundaries for FormData
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[API] POST /api/payment/qr-codes/${method} proxy failed:`, err)
    return NextResponse.json({ error: "Failed to upload QR code" }, { status: 502 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { method: string } }) {
  const { method } = params
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/payment/qr-codes/${method}`, { method: "DELETE" })
    if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[API] DELETE /api/payment/qr-codes/${method} proxy failed:`, err)
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 502 })
  }
}
