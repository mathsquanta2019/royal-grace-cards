"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Card } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, updateQuantity, getItemQuantity } = useCartStore()
  const { toast } = useToast()

  const [product, setProduct] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/cards/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
          // Set quantity to current cart quantity if item is already in cart
          const cartQty = getItemQuantity(data.id)
          if (cartQty > 0) {
            setQuantity(cartQty)
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router, toast, getItemQuantity])

  const handleAddToCart = () => {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }

    toast({
      title: "Added to cart",
      description: `${quantity} ${quantity === 1 ? "item" : "items"} of ${product.name} added to your cart.`,
    })
  }

  const handleIncrement = () => {
    if (product && quantity < product.inventory) {
      setQuantity(quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Product Detail */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                  Image coming soon
                </div>
              )}
              {product.category && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">{product.category}</Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
                {product.inStock ? (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Description</h2>
              <p className="text-base text-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium text-foreground">{product.category || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="font-medium text-foreground">{product.inventory} units</p>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || !product.inStock}
                    className="h-10 w-10 bg-transparent"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold min-w-[3ch] text-center">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleIncrement}
                    disabled={quantity >= product.inventory || !product.inStock}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button size="lg" className="w-full gap-2" onClick={handleAddToCart} disabled={!product.inStock}>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>

              <Link href="/cart" className="block">
                <Button size="lg" variant="outline" className="w-full bg-transparent">
                  View Cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
