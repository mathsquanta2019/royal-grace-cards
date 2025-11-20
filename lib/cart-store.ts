"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Card } from "./types"

interface CartStore {
  items: CartItem[]
  addItem: (card: Card) => void
  removeItem: (cardId: string) => void
  updateQuantity: (cardId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
  getItemQuantity: (cardId: string) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (card) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.card.id === card.id)

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.card.id === card.id ? { ...item, quantity: item.quantity + 1 } : item,
              ),
            }
          }

          return {
            items: [...state.items, { card, quantity: 1 }],
          }
        })
      },

      removeItem: (cardId) => {
        set((state) => ({
          items: state.items.filter((item) => item.card.id !== cardId),
        }))
      },

      updateQuantity: (cardId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cardId)
          return
        }

        set((state) => ({
          items: state.items.map((item) => (item.card.id === cardId ? { ...item, quantity } : item)),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.card.price * item.quantity, 0)
      },

      getItemQuantity: (cardId) => {
        const item = get().items.find((item) => item.card.id === cardId)
        return item ? item.quantity : 0
      },
    }),
    {
      name: "royal-grace-cart",
    },
  ),
)
