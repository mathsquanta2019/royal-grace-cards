import { NextResponse } from "next/server"
import type { PaymentSettings } from "@/lib/types"

let paymentSettings: PaymentSettings = {
  stripeEnabled: true,
  zelleEnabled: true,
  cashappEnabled: true,
  zelleEmail: "payments@royalgracecards.com",
  zellePhone: "(555) 123-4567",
  cashappHandle: "$RoyalGraceCards",
}

export async function GET() {
  // Mock API - In production, fetch from Micronaut backend
  return NextResponse.json(paymentSettings)
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Mock API - In production, send to Micronaut backend
    paymentSettings = { ...paymentSettings, ...data }

    return NextResponse.json(paymentSettings)
  } catch (error) {
    console.error("Failed to update payment settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
