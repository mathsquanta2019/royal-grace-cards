"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input, Textarea } from "@/components/ui/input"
import { ArrowLeft, Package, User, MapPin, CreditCard, Plus, Copy } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTrackingMessage, setNewTrackingMessage] = useState("")
  const [addingTrackingUpdate, setAddingTrackingUpdate] = useState(false)
  const [trackingCodeInput, setTrackingCodeInput] = useState("")
  const [savingTrackingCode, setSavingTrackingCode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrder()
  }, [resolvedParams.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${resolvedParams.id}`)
      if (response.ok) {
        const foundOrder = await response.json()
        setOrder(foundOrder)
        setTrackingCodeInput(foundOrder.trackingCode || "")
      } else {
        setOrder(null)
      }
    } catch (error) {
      console.error("Failed to fetch order:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (field: "paymentStatus" | "fulfillmentStatus", value: string) => {
    if (!order) return

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      const updatedOrder = await response.json()
      setOrder(updatedOrder)

      toast({
        title: "Order Updated",
        description: `Order ${field} updated successfully`,
      })
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      })
    }
  }

  const handleAddTrackingUpdate = async () => {
    if (!order || !newTrackingMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking message",
        variant: "destructive",
      })
      return
    }

    setAddingTrackingUpdate(true)
    try {
      const updates = [...(order.trackingUpdates || [])]
      updates.push({
        status: order.fulfillmentStatus,
        timestamp: new Date().toISOString(),
        message: newTrackingMessage.trim(),
      })

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingUpdates: updates }),
      })

      if (!response.ok) throw new Error("Failed to add tracking update")

      const updatedOrder = await response.json()
      setOrder(updatedOrder)
      setNewTrackingMessage("")

      toast({
        title: "Success",
        description: "Tracking update added successfully",
      })
    } catch (error) {
      console.error("Failed to add tracking update:", error)
      toast({
        title: "Error",
        description: "Failed to add tracking update",
        variant: "destructive",
      })
    } finally {
      setAddingTrackingUpdate(false)
    }
  }

  const handleSaveTrackingCode = async () => {
    if (!order) return

    if (!trackingCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code",
        variant: "destructive",
      })
      return
    }

    setSavingTrackingCode(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCode: trackingCodeInput.trim() }),
      })

      if (!response.ok) throw new Error("Failed to update tracking code")

      const updatedOrder = await response.json()
      setOrder(updatedOrder)

      toast({
        title: "Success",
        description: "Tracking code updated successfully",
      })
    } catch (error) {
      console.error("Failed to save tracking code:", error)
      toast({
        title: "Error",
        description: "Failed to save tracking code",
        variant: "destructive",
      })
    } finally {
      setSavingTrackingCode(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Tracking code copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading order details...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Order not found</p>
              <Link href="/admin">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
              <p className="text-sm text-muted-foreground font-mono">#{order.id}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Order Date</div>
              <div className="font-medium">{new Date(order.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-4">
                        {item.card.imageUrl ? (
                          <img
                            src={item.card.imageUrl}
                            alt={item.card.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted grid place-items-center text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.card.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.card.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
                            <span className="text-sm font-medium">${item.card.price.toFixed(2)} each</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${(item.card.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                      {index < order.items.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>
                      {order.shippingFee === 0 ? (
                        <span className="text-accent font-medium">FREE</span>
                      ) : (
                        `$${order.shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{order.customerPhone}</div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic">
                  <div>{order.shippingAddress.street}</div>
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </div>
                </address>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tracking Code</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={trackingCodeInput}
                      onChange={(e) => setTrackingCodeInput(e.target.value)}
                      placeholder="Enter tracking code (e.g., TRK-XXXXX-XXXXX)"
                      className="font-mono flex-1"
                    />
                    <Button onClick={handleSaveTrackingCode} disabled={savingTrackingCode} size="sm" className="gap-2">
                      {savingTrackingCode ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(order?.trackingCode || "")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Tracking Updates</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {order?.trackingUpdates && order.trackingUpdates.length > 0 ? (
                      order.trackingUpdates.map((update, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant="outline" className="capitalize">
                              {update.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">{update.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tracking updates yet</p>
                    )}
                  </div>
                </div>

                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Add Tracking Update</p>
                  <Textarea
                    placeholder="Enter tracking update message (e.g., Package picked up by carrier)..."
                    value={newTrackingMessage}
                    onChange={(e) => setNewTrackingMessage(e.target.value)}
                    className="text-sm resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleAddTrackingUpdate}
                    disabled={addingTrackingUpdate}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    {addingTrackingUpdate ? "Adding..." : "Add Update"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Payment Status</Label>
                  <Select
                    value={order.paymentStatus}
                    onValueChange={(value) => updateOrderStatus("paymentStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Fulfillment Status</Label>
                  <Select
                    value={order.fulfillmentStatus}
                    onValueChange={(value) => updateOrderStatus("fulfillmentStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base">
                  {order.paymentMethod === "stripe" && "Credit Card (Stripe)"}
                  {order.paymentMethod === "zelle" && "Zelle"}
                  {order.paymentMethod === "cashapp" && "Cash App"}
                </Badge>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div className="font-medium">{new Date(order.updatedAt).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
