"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"

export function Navbar() {
  const cartItemCount = useCartStore((state) => state.getTotalItems())

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">RG</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Royal Grace Cards</h1>
              <p className="text-sm text-muted-foreground">Handcrafted Texas Greeting Cards</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/order-tracking">
              <Button variant="outline" size="lg" className="bg-transparent">
                Track Order
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="lg" className="relative bg-transparent">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {cartItemCount}
                  </Badge>
                )}
                <span className="ml-2 hidden sm:inline">Cart</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
