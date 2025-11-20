import { NextResponse } from "next/server"

// Deprecated local route: direct clients to new upload endpoints
export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint deprecated",
      message:
        "Use /api/payment/qr-codes/[method] with POST (multipart/form-data) to upload and GET to retrieve.",
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint deprecated",
      message:
        "Use /api/payment/qr-codes/[method] with POST (multipart/form-data), field 'file'.",
    },
    { status: 410 }
  )
}
