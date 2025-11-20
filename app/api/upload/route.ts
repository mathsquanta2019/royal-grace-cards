import { NextResponse } from "next/server"

// Deprecated mock upload route — instruct clients to use per-card image API
export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint deprecated",
      message:
        "Upload product images with POST /api/cards/{id}/image (multipart/form-data; field 'file'). For payment QR, use /api/payment/qr-codes/{method}.",
    },
    { status: 410 }
  )
}
