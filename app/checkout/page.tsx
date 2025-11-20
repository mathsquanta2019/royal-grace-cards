"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { ShippingSettings, PaymentSettings } from "@/lib/types"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    street: "",
    city: "",
    state: "TX",
    zipCode: "",
    paymentMethod: "stripe" as "stripe" | "zelle" | "cashapp",
  })

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items, router])

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [shippingRes, paymentRes] = await Promise.all([
          fetch("/api/settings/shipping"),
          fetch("/api/settings/payment"),
        ])

        const shippingData = await shippingRes.json()
        const paymentData = await paymentRes.json()

        setShippingSettings(shippingData)
        setPaymentSettings(paymentData)
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      }
    }

    fetchSettings()
  }, [])

  const subtotal = items.reduce((total, item) => total + item.card.price * item.quantity, 0)
  const shippingFee =
    shippingSettings && subtotal >= shippingSettings.freeShippingThreshold
      ? 0
      : shippingSettings?.standardShippingFee || 0
  const total = subtotal + shippingFee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        items,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        subtotal,
        shippingFee,
        total,
        paymentMethod: formData.paymentMethod,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      const order = await response.json()

      // Handle different payment methods
      if (formData.paymentMethod === "stripe") {
        // Call Micronaut backend to get Stripe checkout URL
        const stripeResponse = await fetch("/api/payment/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, amount: total }),
        })

        if (!stripeResponse.ok) {
          throw new Error("Failed to create Stripe checkout session")
        }

        const { checkoutUrl } = await stripeResponse.json()

        // Redirect to Stripe checkout
        toast({
          title: "Redirecting to payment...",
          description: "You will be redirected to Stripe to complete your payment.",
        })

        // In production, this would redirect to the real Stripe URL
        // window.location.href = checkoutUrl

        // For demo, simulate redirect and complete order
        setTimeout(() => {
          clearCart()
          router.push(`/order-confirmation?orderId=${order.id}`)
        }, 1500)
      } else {
        // For QR code payments (Zelle/CashApp)
        router.push(`/payment/qr-code?orderId=${order.id}&method=${formData.paymentMethod}`)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cart">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Shipping Address</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Austin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        placeholder="TX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        placeholder="78701"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Payment Method</h2>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value as any }))}
                  className="space-y-3"
                >
                  {paymentSettings?.stripeEnabled && (
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-muted-foreground">Pay securely with Stripe</div>
                        </div>
                      </Label>
                    </div>
                  )}
                  {paymentSettings?.zelleEnabled && (
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="zelle" id="zelle" />
                      <Label htmlFor="zelle" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Zelle</div>
                          <div className="text-sm text-muted-foreground">Pay with Zelle QR code</div>
                        </div>
                      </Label>
                    </div>
                  )}
                  {paymentSettings?.cashappEnabled && (
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="cashapp" id="cashapp" />
                      <Label htmlFor="cashapp" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Cash App</div>
                          <div className="text-sm text-muted-foreground">Pay with Cash App QR code</div>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-6 lg:sticky lg:top-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.card.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.card.name} × {item.quantity}
                      </span>
                      <span className="font-medium">${(item.card.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
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
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
