import type { Card, Order, ShippingSettings } from "./types"

export const mockCards: Card[] = [
  {
    id: "1",
    name: "Merry Christmas from Texas - Longhorn",
    description: "Festive Christmas card featuring a Texas Longhorn wearing a Santa hat with beautiful wildflowers.",
    price: 4.99,
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_180741-5f78OOBs55in2DaofAP6PoLfflBrKY.jpg",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_180741-5f78OOBs55in2DaofAP6PoLfflBrKY.jpg",
    ],
    category: "Christmas",
    inStock: true,
    inventory: 100,
  },
  {
    id: "2",
    name: "Texas Christmas Tree",
    description: "Elegant Christmas card with a Texas-shaped Christmas tree decorated with gold ornaments.",
    price: 4.99,
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_180621-7rVs10cgHJYu6FIGvVBi0qXbXRGfLA.jpg",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_180621-7rVs10cgHJYu6FIGvVBi0qXbXRGfLA.jpg",
    ],
    category: "Christmas",
    inStock: true,
    inventory: 150,
  },
  {
    id: "3",
    name: "Christmas Y'all from Texas",
    description: "Cheerful Christmas card with a colorful star tree design and southern charm.",
    price: 4.99,
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_181218-uI2zxoUzFSu7iMZB72nZvj35kHd49C.jpg",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_181218-uI2zxoUzFSu7iMZB72nZvj35kHd49C.jpg",
    ],
    category: "Christmas",
    inStock: true,
    inventory: 75,
  },
  {
    id: "4",
    name: "Merry Christmas from Texas - Ornaments",
    description: "Beautiful Christmas card featuring Texas outline decorated with festive ornaments.",
    price: 4.99,
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_181347-gEFLSpsfikYswBnE2VmiLCAqmvgVio.jpg",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251106_181347-gEFLSpsfikYswBnE2VmiLCAqmvgVio.jpg",
    ],
    category: "Christmas",
    inStock: true,
    inventory: 120,
  },
]

export const defaultShippingSettings: ShippingSettings = {
  freeShippingThreshold: 20,
  standardShippingFee: 5.99,
}

// In-memory storage for orders (simulating database)
export const mockOrders: Order[] = [
  {
    id: "order-001",
    items: [
      { card: mockCards[0], quantity: 2 },
      { card: mockCards[1], quantity: 1 },
    ],
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    customerPhone: "(555) 123-4567",
    shippingAddress: {
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
    },
    subtotal: 14.97,
    shippingFee: 5.99,
    total: 20.96,
    paymentMethod: "stripe",
    paymentStatus: "completed",
    fulfillmentStatus: "pending",
    trackingCode: "TRACK-001-ABC123",
    trackingUpdates: [
      {
        status: "pending",
        timestamp: new Date("2025-01-05").toISOString(),
        message: "Order confirmed",
      },
    ],
    createdAt: new Date("2025-01-05").toISOString(),
    updatedAt: new Date("2025-01-05").toISOString(),
  },
]

export const currentShippingSettings = { ...defaultShippingSettings }
