"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTrackingCode, setSearchTrackingCode] = useState("")
  const [searched, setSearched] = useState(false)

  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    } else {
      setLoading(false)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${id}`)
      if (!response.ok) {
        throw new Error("Order not found")
      }
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error("Failed to fetch order:", error)
      toast({
        title: "Error",
        description: "Failed to load order information.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTrackingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code.",
        variant: "destructive",
      })
      return
    }

    // Search through orders by tracking code
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const orders = await response.json()
      const foundOrder = orders.find((o: Order) => o.trackingCode === searchTrackingCode.trim())

      if (foundOrder) {
        setOrder(foundOrder)
        setSearched(true)
      } else {
        toast({
          title: "Not Found",
          description: "No order found with that tracking code.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to search orders:", error)
      toast({
        title: "Error",
        description: "Failed to search for order.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case "shipped":
        return <Truck className="h-6 w-6 text-blue-500" />
      case "processing":
        return <Package className="h-6 w-6 text-amber-500" />
      case "pending":
        return <Clock className="h-6 w-6 text-gray-500" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "shipped":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "processing":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "pending":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
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

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Tracking</h1>
          <p className="text-muted-foreground mb-8">Track your order status and shipping updates</p>

          {!order && (
            <Card className="p-6 mb-8">
              <form onSubmit={handleSearchTracking} className="space-y-4">
                <div>
                  <label htmlFor="tracking" className="text-sm font-medium text-foreground mb-2 block">
                    Search by Tracking Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="tracking"
                      placeholder="Enter your tracking code (e.g., TRK-XXXXX-XXXXX)"
                      value={searchTrackingCode}
                      onChange={(e) => setSearchTrackingCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
              </form>

              {!searched && (
                <p className="text-sm text-muted-foreground mt-4">
                  Enter your tracking code from your order confirmation email to view your shipment status.
                </p>
              )}
            </Card>
          )}

          {loading && !order && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading order information...</p>
            </div>
          )}

          {order && (
            <>
              {/* Order Header */}
              <Card className="p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">Order #{order.id.slice(0, 8)}</h2>
                    <p className="text-sm text-muted-foreground">
                      Tracking Code: <span className="font-mono font-semibold">{order.trackingCode}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(order.fulfillmentStatus)}>
                    {order.fulfillmentStatus}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mt-6 pt-6 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium text-foreground">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping Address</p>
                    <p className="font-medium text-foreground text-sm">
                      {order.shippingAddress.street}
                      <br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Order Items */}
              <Card className="p-6 mb-6">
                <h3 className="font-bold text-foreground mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">{item.card.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">${(item.card.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </Card>

              {/* Tracking Timeline */}
              <Card className="p-6 mb-6">
                <h3 className="font-bold text-foreground mb-6">Tracking History</h3>
                <div className="space-y-6">
                  {order.trackingUpdates && order.trackingUpdates.length > 0 ? (
                    order.trackingUpdates.map((update, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {getStatusIcon(update.status)}
                          {idx < order.trackingUpdates!.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground capitalize">{update.status}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(update.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No tracking updates yet.</p>
                  )}
                </div>
              </Card>

              {/* Order Summary */}
              <Card className="p-6 bg-muted/50">
                <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">
                      {order.shippingFee === 0 ? "FREE" : `$${order.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="outline" className={getStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
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
      <OrderTrackingContent />
    </Suspense>
  )
}
