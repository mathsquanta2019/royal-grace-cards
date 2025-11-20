export interface Card {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  images: string[] // Multiple product images
  category: string
  inStock: boolean
  inventory: number // Track quantity in stock
}

export interface CartItem {
  card: Card
  quantity: number
}

export interface ShippingSettings {
  freeShippingThreshold: number
  standardShippingFee: number
}

export interface PaymentSettings {
  stripeEnabled: boolean
  zelleEnabled: boolean
  cashappEnabled: boolean
  zelleEmail: string
  zellePhone: string
  cashappHandle: string
}

export interface Order {
  id: string
  items: CartItem[]
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  subtotal: number
  shippingFee: number
  total: number
  paymentMethod: "stripe" | "zelle" | "cashapp"
  paymentStatus: "pending" | "completed" | "failed"
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered"
  trackingCode?: string
  trackingUpdates?: {
    status: string
    timestamp: string
    message: string
  }[]
  createdAt: string
  updatedAt: string
}
