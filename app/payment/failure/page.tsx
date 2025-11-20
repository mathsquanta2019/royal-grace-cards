"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

function PaymentFailureContent() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("error") || "Payment processing failed"
  const orderId = searchParams.get("orderId")
  const [errorDetails, setErrorDetails] = useState<string>(errorMessage)

  useEffect(() => {
    // Decode error message if it's encoded
    try {
      setErrorDetails(decodeURIComponent(errorMessage))
    } catch (e) {
      setErrorDetails(errorMessage)
    }
  }, [errorMessage])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Error Header */}
          <Card className="p-8 text-center mb-8 border-destructive/20 bg-destructive/5">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">Payment Failed</h1>
            <p className="text-lg text-muted-foreground mb-6">
              We couldn't process your payment. Please try again or contact support.
            </p>

            {/* Error Details */}
            <div className="bg-muted p-6 rounded-lg mb-8 text-left border border-destructive/10">
              <h2 className="font-semibold text-foreground mb-3">Error Details:</h2>
              <p className="text-sm text-muted-foreground font-mono break-words">{errorDetails}</p>
              {orderId && (
                <p className="text-sm text-muted-foreground mt-3">
                  <span className="font-medium">Order ID:</span> {orderId}
                </p>
              )}
            </div>

            {/* Helpful Information */}
            <div className="bg-card p-6 rounded-lg mb-8 border text-left">
              <h3 className="font-semibold text-foreground mb-3">What can you do?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Try again with the same payment method</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Use a different payment method</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Contact your bank to verify the transaction</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Reach out to our support team for assistance</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="p-6">
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/checkout">
                <Button size="lg">Try Again</Button>
              </Link>
              <Link href="/cart">
                <Button size="lg" variant="outline">
                  Review Cart
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="ghost">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </Card>

          {/* Support Section */}
          <div className="mt-8 p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Need help? Contact our support team at support@royalgracecards.com
            </p>
            <p className="text-xs text-muted-foreground">
              We're here to help resolve any payment issues you may encounter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
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
      <PaymentFailureContent />
    </Suspense>
  )
}
