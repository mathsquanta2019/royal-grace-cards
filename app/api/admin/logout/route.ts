import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Delete admin session cookie on the response
    const res = NextResponse.json({ success: true, message: "Logged out successfully" })
    res.cookies.delete("admin_session")
    return res
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}
