"use client"

import { useState, useEffect } from "react"
import type { Card } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, updateQuantity, getTotalItems, getItemQuantity } = useCartStore()
  const { toast } = useToast()
  const cartItemCount = useCartStore((state) => state.getTotalItems())

  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch("/api/cards")
        const data = await response.json().catch(() => ({ error: "bad_json" }))
        if (!response.ok || !Array.isArray(data)) {
          console.error("[UI] /api/cards returned non-OK or non-array:", {
            status: response.status,
            bodyType: typeof data,
            body: data,
          })
          setCards([])
          toast({
            title: "Error",
            description: "Failed to load cards. Please try again.",
            variant: "destructive",
          })
        } else {
          setCards(data)
        }
      } catch (error) {
        console.error("Failed to fetch cards:", error)
        toast({
          title: "Error",
          description: "Failed to load cards. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [toast])

  const handleAddToCart = (card: Card) => {
    addItem(card)
    toast({
      title: "Added to cart",
      description: `${card.name} has been added to your cart.`,
    })
  }

  const handleIncrement = (card: Card) => {
    const currentQty = getItemQuantity(card.id)
    updateQuantity(card.id, currentQty + 1)
  }

  const handleDecrement = (card: Card) => {
    const currentQty = getItemQuantity(card.id)
    if (currentQty > 1) {
      updateQuantity(card.id, currentQty - 1)
    } else {
      updateQuantity(card.id, 0)
      toast({
        title: "Removed from cart",
        description: `${card.name} has been removed from your cart.`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-secondary to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground text-balance mb-4 md:text-5xl">
            Texas-Made Greeting Cards with Heart
          </h2>
          <p className="text-lg text-muted-foreground text-pretty mx-auto max-w-2xl">
            Celebrate every occasion with our handcrafted greeting cards, made with love in Texas. Each card tells a
            story and brings a smile.
          </p>
        </div>
      </section>

      {/* Card Catalog */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-foreground mb-8">Our Collection</h3>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No cards available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((card) => {
                const quantity = getItemQuantity(card.id)
                const isInCart = quantity > 0

                return (
                  <div
                    key={card.id}
                    className="group rounded-lg border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    <Link href={`/products/${card.id}`} className="flex-1">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted cursor-pointer">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={card.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            priority={false}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                            Image coming soon
                          </div>
                        )}
                        {card.category && (
                          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                            {card.category}
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link href={`/products/${card.id}`} className="hover:text-primary transition-colors">
                        <h4 className="font-semibold text-foreground text-balance mb-2 cursor-pointer hover:text-primary">
                          {card.name}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground text-pretty mb-4 line-clamp-2">{card.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">${card.price.toFixed(2)}</span>
                        {isInCart ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDecrement(card)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-[2ch] text-center">{quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleIncrement(card)}
                              className="h-8 w-8"
                              disabled={!card.inStock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => handleAddToCart(card)} disabled={!card.inStock} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                      {!card.inStock && <p className="text-sm text-destructive mt-2">Out of stock</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2025 Royal Grace Cards. Handcrafted with love in Texas.</p>
        </div>
      </footer>
    </div>
  )
}
