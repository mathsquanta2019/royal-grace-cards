"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { ShippingSettings } from "@/lib/types"

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem } = useCartStore()
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)

  useEffect(() => {
    async function fetchShippingSettings() {
      try {
        const response = await fetch("/api/settings/shipping")
        const data = await response.json()
        setShippingSettings(data)
      } catch (error) {
        console.error("Failed to fetch shipping settings:", error)
      }
    }

    fetchShippingSettings()
  }, [])

  const subtotal = items.reduce((total, item) => total + item.card.price * item.quantity, 0)
  const shippingFee =
    shippingSettings && subtotal >= shippingSettings.freeShippingThreshold
      ? 0
      : shippingSettings?.standardShippingFee || 0
  const total = subtotal + shippingFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Store
              </Button>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-md">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any cards yet. Start shopping to fill your cart!
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.card.id} className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.card.imageUrl ? (
                      <Image src={item.card.imageUrl} alt={item.card.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">No image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-balance mb-1">{item.card.name}</h3>
                    <p className="text-sm text-muted-foreground text-pretty mb-3 line-clamp-2">
                      {item.card.description}
                    </p>
                    <p className="text-lg font-bold text-primary">${item.card.price.toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.card.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.card.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.card.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-accent font-medium">FREE</span>
                    ) : (
                      `$${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shippingSettings && subtotal < shippingSettings.freeShippingThreshold && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    Add ${(shippingSettings.freeShippingThreshold - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <Button size="lg" className="w-full" onClick={() => router.push("/checkout")}>
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
