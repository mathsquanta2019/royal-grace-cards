"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCartStore } from "@/lib/cart-store"
import Image from "next/image"

function QRCodePaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { clearCart } = useCartStore()
  const [qrCodeData, setQrCodeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const orderId = searchParams.get("orderId")
  const method = searchParams.get("method")

  useEffect(() => {
    if (!orderId || !method) {
      router.push("/cart")
      return
    }

    async function fetchQRCode() {
      try {
        const response = await fetch(`/api/payment/qr-codes?method=${method}`)
        const data = await response.json()
        setQrCodeData(data)
      } catch (error) {
        console.error("Failed to fetch QR code:", error)
        toast({
          title: "Error",
          description: "Failed to load payment information.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQRCode()
  }, [orderId, method, router, toast])

  const handlePaymentComplete = async () => {
    setConfirming(true)
    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, method }),
      })

      if (!response.ok) {
        throw new Error("Failed to verify payment")
      }

      clearCart()
      toast({
        title: "Payment Confirmed",
        description: "Thank you for your payment. Your order is being processed.",
      })

      router.push(`/order-confirmation?orderId=${orderId}`)
    } catch (error) {
      console.error("Payment verification error:", error)
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setConfirming(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Information copied to clipboard.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" className="gap-2" onClick={() => router.push("/checkout")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Checkout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Payment</h1>
              <p className="text-muted-foreground">
                Scan the QR code below with your {method === "zelle" ? "Zelle" : "Cash App"} app to complete payment
              </p>
            </div>

            {qrCodeData && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    {qrCodeData.qrCodeUrl ? (
                      <Image
                        src={qrCodeData.qrCodeUrl}
                        alt={`${method} QR Code`}
                        width={300}
                        height={300}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-[300px] h-[300px] grid place-items-center text-sm text-muted-foreground">
                        QR code not uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Payment Instructions:</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{qrCodeData.instructions}</p>
                </div>

                {/* Recipient Information */}
                <div className="bg-muted p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Payment Details:</h3>
                  <div className="space-y-3">
                    {qrCodeData.recipientInfo.email && (
                      <div className="flex items-center justify-between p-2 bg-background rounded">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">{qrCodeData.recipientInfo.email}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(qrCodeData.recipientInfo.email)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {qrCodeData.recipientInfo.phone && (
                      <div className="flex items-center justify-between p-2 bg-background rounded">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">{qrCodeData.recipientInfo.phone}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(qrCodeData.recipientInfo.phone)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {qrCodeData.recipientInfo.handle && (
                      <div className="flex items-center justify-between p-2 bg-background rounded">
                        <span className="text-sm text-muted-foreground">Handle:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">{qrCodeData.recipientInfo.handle}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(qrCodeData.recipientInfo.handle)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-muted rounded-lg">
                  <code className="bg-background px-3 py-2 rounded text-sm font-mono">Order ID: {orderId}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(orderId || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full gap-2" onClick={handlePaymentComplete} disabled={confirming}>
                    <CheckCircle className="h-5 w-5" />
                    {confirming ? "Verifying Payment..." : "I've Completed the Payment"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    After completing the payment, click the button above to confirm your order.
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function QRCodePaymentPage() {
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
      <QRCodePaymentContent />
    </Suspense>
  )
}
