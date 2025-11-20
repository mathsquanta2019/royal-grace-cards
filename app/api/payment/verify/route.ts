import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

export async function POST(request: Request) {
  try {
    const { orderId, method } = await request.json()

    if (!orderId || !method) {
      return NextResponse.json({ error: "Missing orderId or method" }, { status: 400 })
    }

    // For QR code payments, mark as completed when customer confirms
    if (method === "zelle" || method === "cashapp") {
      const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentStatus: "completed" }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        return NextResponse.json(data, { status: res.status })
      }

      return NextResponse.json({
        success: true,
        message: `Payment verified successfully via ${method}`,
        order: data,
      })
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
  } catch (error) {
    console.error("Failed to verify payment:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 502 })
  }
}
