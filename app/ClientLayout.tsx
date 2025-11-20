"use client"

import type React from "react"
import { Navbar } from "@/components/navbar"
import { usePathname } from "next/navigation"

export function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  const showNavbar = !pathname.startsWith("/admin")

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  )
}
