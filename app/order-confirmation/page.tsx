"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Order } from "@/lib/types"

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    } else {
      setLoading(false)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
    } catch (error) {
      console.error("Failed to fetch order:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="p-8 text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-accent" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>

            {loading ? (
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            ) : order ? (
              <>
                <div className="bg-muted p-6 rounded-lg mb-6 text-left">
                  <div className="grid gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <code className="text-lg font-mono font-semibold text-foreground">{order.id}</code>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tracking Code</p>
                      <code className="text-lg font-mono font-semibold text-foreground">{order.trackingCode}</code>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-3">Order Details:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium capitalize">{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <span className="font-medium capitalize">{order.paymentStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Shipping To:</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.shippingAddress.street}
                      <br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </Card>

          {order && order.items.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Order Items</h2>
              <div className="grid gap-6">
                {order.items.map((item) => (
                  <div key={item.card.id} className="flex gap-4 pb-6 border-b last:pb-0 last:border-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted">
                        {item.card.imageUrl ? (
                          <Image src={item.card.imageUrl} alt={item.card.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{item.card.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.card.description}</p>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium text-foreground">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Item</p>
                          <p className="font-medium text-foreground">${item.card.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Subtotal</p>
                          <p className="font-bold text-primary">${(item.card.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="p-6">
            <p className="text-muted-foreground text-center mb-6">
              We'll start processing your order right away. You'll receive email updates on your order status.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/">
                <Button size="lg">Continue Shopping</Button>
              </Link>
              {order && (
                <Link href={`/order-tracking?orderId=${order.id}`}>
                  <Button size="lg" variant="outline">
                    Track Order
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
