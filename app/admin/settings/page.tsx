"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Truck, DollarSign, Store, QrCode, CreditCard, Upload, X } from "lucide-react"
import type { ShippingSettings, PaymentSettings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 0,
    standardShippingFee: 0,
  })
  const [storeInfo, setStoreInfo] = useState({
    storeName: "Royal Grace Cards",
    storeEmail: "contact@royalgracecards.com",
    storePhone: "(555) 123-4567",
    storeAddress: "123 Main Street, Austin, TX 78701",
    about: "Texas-themed greeting cards for all occasions",
  })
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: true,
    zelleEnabled: true,
    cashappEnabled: true,
    zelleEmail: "payments@royalgracecards.com",
    zellePhone: "(555) 123-4567",
    cashappHandle: "$RoyalGraceCards",
  })
  const [zelleQRPreview, setZelleQRPreview] = useState<string>("")
  const [cashappQRPreview, setCashappQRPreview] = useState<string>("")
  const [uploadingZelleQR, setUploadingZelleQR] = useState(false)
  const [uploadingCashappQR, setUploadingCashappQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
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
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/settings/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingSettings),
      })

      if (!response.ok) throw new Error("Failed to update settings")

      const updatedSettings = await response.json()
      setShippingSettings(updatedSettings)

      toast({
        title: "Settings Saved",
        description: "Shipping settings have been updated successfully",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save shipping settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Store Information Saved",
      description: "Your store information has been updated",
    })
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/settings/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentSettings),
      })

      if (!response.ok) throw new Error("Failed to update payment settings")

      const updatedSettings = await response.json()
      setPaymentSettings(updatedSettings)

      toast({
        title: "Payment Settings Saved",
        description: "Payment methods have been updated successfully",
      })
    } catch (error) {
      console.error("Failed to save payment settings:", error)
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleZelleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setZelleQRPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingZelleQR(true)
    try {
      const formData = new FormData()
      formData.append("method", "zelle")
      formData.append("qrCode", file)

      const response = await fetch("/api/payment/qr-codes", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload QR code")

      toast({
        title: "Success",
        description: "Zelle QR code uploaded successfully",
      })
    } catch (error) {
      console.error("Failed to upload Zelle QR code:", error)
      toast({
        title: "Error",
        description: "Failed to upload Zelle QR code",
        variant: "destructive",
      })
      setZelleQRPreview("")
    } finally {
      setUploadingZelleQR(false)
    }
  }

  const handleCashappQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCashappQRPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingCashappQR(true)
    try {
      const formData = new FormData()
      formData.append("method", "cashapp")
      formData.append("qrCode", file)

      const response = await fetch("/api/payment/qr-codes", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload QR code")

      toast({
        title: "Success",
        description: "Cash App QR code uploaded successfully",
      })
    } catch (error) {
      console.error("Failed to upload Cash App QR code:", error)
      toast({
        title: "Error",
        description: "Failed to upload Cash App QR code",
        variant: "destructive",
      })
      setCashappQRPreview("")
    } finally {
      setUploadingCashappQR(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 pb-20 md:pb-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Configure your store settings and preferences</p>
      </div>

      <Tabs defaultValue="shipping" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipping" className="gap-2 text-xs sm:text-sm">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2 text-xs sm:text-sm">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Store Info</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Configuration
              </CardTitle>
              <CardDescription>Set your shipping fees and free shipping thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveShipping} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="standardShippingFee">Standard Shipping Fee</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="standardShippingFee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingSettings.standardShippingFee}
                        onChange={(e) =>
                          setShippingSettings({
                            ...shippingSettings,
                            standardShippingFee: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        className="pl-9"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The flat rate shipping fee charged for orders below the free shipping threshold
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (Quantity)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      min="0"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) =>
                        setShippingSettings({
                          ...shippingSettings,
                          freeShippingThreshold: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="20"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Orders with this many items or more qualify for free shipping
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Preview</h4>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      Orders under {shippingSettings.freeShippingThreshold} items:{" "}
                      <span className="text-foreground font-medium">
                        ${shippingSettings.standardShippingFee.toFixed(2)} shipping fee
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Orders {shippingSettings.freeShippingThreshold} items or more:{" "}
                      <span className="text-accent font-medium">FREE shipping</span>
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={saving} className="gap-2">
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Shipping Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
              <CardDescription>Update your store details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveStore} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeInfo.storeName}
                      onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                      placeholder="Royal Grace Cards"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeInfo.storeEmail}
                      onChange={(e) => setStoreInfo({ ...storeInfo, storeEmail: e.target.value })}
                      placeholder="contact@royalgracecards.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input
                      id="storePhone"
                      value={storeInfo.storePhone}
                      onChange={(e) => setStoreInfo({ ...storeInfo, storePhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <Input
                      id="storeAddress"
                      value={storeInfo.storeAddress}
                      onChange={(e) => setStoreInfo({ ...storeInfo, storeAddress: e.target.value })}
                      placeholder="123 Main Street, Austin, TX"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About Your Store</Label>
                  <Textarea
                    id="about"
                    value={storeInfo.about}
                    onChange={(e) => setStoreInfo({ ...storeInfo, about: e.target.value })}
                    placeholder="Tell customers about your business..."
                    rows={4}
                  />
                </div>

                <Button type="submit" size="lg" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Store Information
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <QrCode className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Configure payment methods and upload QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePayment} className="space-y-8">
                <div className="space-y-4 pb-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Stripe Payments
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Accept credit and debit cards securely through Stripe
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="stripeEnabled"
                        checked={paymentSettings.stripeEnabled}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="stripeEnabled" className="cursor-pointer font-medium">
                        {paymentSettings.stripeEnabled ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Stripe integration requires API configuration. See documentation for setup instructions.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pb-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Zelle Payments</h3>
                      <p className="text-sm text-muted-foreground mt-1">Accept payments through Zelle with QR code</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="zelleEnabled"
                        checked={paymentSettings.zelleEnabled}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, zelleEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="zelleEnabled" className="cursor-pointer font-medium">
                        {paymentSettings.zelleEnabled ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  {paymentSettings.zelleEnabled && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="zelleEmail">Zelle Email</Label>
                          <Input
                            id="zelleEmail"
                            type="email"
                            value={paymentSettings.zelleEmail}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, zelleEmail: e.target.value })}
                            placeholder="payments@royalgracecards.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zellePhone">Zelle Phone</Label>
                          <Input
                            id="zellePhone"
                            value={paymentSettings.zellePhone}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, zellePhone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <Label className="font-semibold">Zelle QR Code</Label>
                        <p className="text-sm text-muted-foreground">
                          Upload your Zelle QR code to display to customers during payment
                        </p>
                        <div className="flex gap-4 items-start">
                          {zelleQRPreview && (
                            <div className="relative">
                              <img src={zelleQRPreview} alt="Zelle QR" className="w-24 h-24 rounded-lg border" />
                              <button
                                type="button"
                                onClick={() => setZelleQRPreview("")}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex-1">
                            <label className="cursor-pointer">
                              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-background/50 transition">
                                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (max 5MB)</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleZelleQRUpload}
                                className="hidden"
                                disabled={uploadingZelleQR}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Cash App Payments</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Accept payments through Cash App with QR code
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cashappEnabled"
                        checked={paymentSettings.cashappEnabled}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, cashappEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="cashappEnabled" className="cursor-pointer font-medium">
                        {paymentSettings.cashappEnabled ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  {paymentSettings.cashappEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cashappHandle">Cash App Handle</Label>
                        <Input
                          id="cashappHandle"
                          value={paymentSettings.cashappHandle}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, cashappHandle: e.target.value })}
                          placeholder="$RoyalGraceCards"
                        />
                      </div>

                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <Label className="font-semibold">Cash App QR Code</Label>
                        <p className="text-sm text-muted-foreground">
                          Upload your Cash App QR code to display to customers during payment
                        </p>
                        <div className="flex gap-4 items-start">
                          {cashappQRPreview && (
                            <div className="relative">
                              <img src={cashappQRPreview} alt="Cash App QR" className="w-24 h-24 rounded-lg border" />
                              <button
                                type="button"
                                onClick={() => setCashappQRPreview("")}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex-1">
                            <label className="cursor-pointer">
                              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-background/50 transition">
                                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (max 5MB)</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCashappQRUpload}
                                className="hidden"
                                disabled={uploadingCashappQR}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button type="submit" size="lg" disabled={saving} className="gap-2 w-full sm:w-auto">
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Payment Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
