'use client'

import { useEffect, useMemo, useState } from 'react'
import { Product } from '@/app/(admin)/apps/shopify/products/types'
import { Order } from '@/app/(admin)/apps/shopify/orders/types'
import { Pin } from '@/app/(admin)/apps/pinterest/pins/types'
import { Board } from '@/app/(admin)/apps/pinterest/boards/types'
import { Design } from '@/app/(admin)/design-library/designs/types'
import { generateProducts } from '@/app/(admin)/apps/shopify/products/utils'
import { generatePins } from '@/app/(admin)/apps/pinterest/pins/utils'
import { generateBoards } from '@/app/(admin)/apps/pinterest/boards/utils'
import { generateDesigns } from '@/app/(admin)/design-library/designs/utils'
import { getTransformedOrders } from '@/app/(admin)/apps/shopify/orders/services/orderService'
import { getPinsForPage, getTotalChunks } from '@/app/(admin)/apps/pinterest/pins/services/pinService'
import { fetchBoards } from '@/app/(admin)/apps/pinterest/boards/services/boardService'

type DashboardData = {
  products: Product[]
  orders: Order[]
  pins: Pin[]
  boards: Board[]
  designs: Design[]
  topProducts: { name: string; units: number; revenue: number }[]
  totals: {
    products: number
    orders: number
    pins: number
    boards: number
    designs: number
    sales: number
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

function mapRecordToProduct(raw: any, idx: number): Product {
  const title = String(raw?.title ?? raw?.name ?? `Product ${idx + 1}`)
  const variantsArray: any[] = Array.isArray(raw?.variants) ? raw.variants : []
  const totalInventory = variantsArray.reduce((sum, v) => sum + (Number(v?.inventory_quantity ?? v?.inventoryQuantity ?? 0) || 0), 0)
  const imagesArr = Array.isArray(raw?.images) ? raw.images : (raw?.image ? [raw.image] : [])
  const imageUrls = imagesArr.map((img: any) => typeof img === 'string' ? img : (img?.src || img?.url)).filter(Boolean)
  const parseDate = (value: any): string => {
    const d = value ? new Date(value) : new Date()
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  return {
    id: String(raw?.id ?? raw?.product_id ?? raw?.gid ?? `p-${Date.now()}-${idx}`),
    title,
    handle: String(raw?.handle ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    vendor: String(raw?.vendor ?? raw?.brand ?? ''),
    productType: String(raw?.product_type ?? raw?.productType ?? raw?.category ?? ''),
    price: Number(raw?.price ?? raw?.variants?.[0]?.price ?? 0) || 0,
    compareAtPrice: raw?.compare_at_price != null ? Number(raw.compare_at_price) : undefined,
    cost: Number(raw?.variants?.[0]?.cost ?? raw?.cost ?? 0) || 0,
    inventoryQuantity: Number(raw?.inventory_quantity ?? raw?.inventoryQuantity ?? totalInventory) || 0,
    status: (String(raw?.status ?? 'active').toLowerCase() as any) || 'active',
    publishedAt: raw?.published_at ? parseDate(raw.published_at) : undefined,
    createdAt: parseDate(raw?.created_at ?? raw?.createdAt),
    updatedAt: parseDate(raw?.updated_at ?? raw?.updatedAt),
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    images: imageUrls.length > 0 ? imageUrls : [`https://picsum.photos/300/300?grayscale=1&random=${idx}`],
    variants: [],
    collections: [],
    selected: false,
    salesChannels: Number(raw?.salesChannels ?? 1) || 1,
    category: String(raw?.product_type ?? raw?.category ?? '') || undefined,
  }
}

async function fetchProductsOrFallback(): Promise<Product[]> {
  try {
    // Try chunk:0 first since we know it exists
    const chunk0Url = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-products&key=chunk:0`
    const res = await fetch(chunk0Url, { signal: AbortSignal.timeout(1500) })
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json?.data)) return json.data.map(mapRecordToProduct)
    }
  } catch {}

  try {
    const keysUrl = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-products`
    const keysRes = await fetch(keysUrl, { signal: AbortSignal.timeout(1500) })
    if (!keysRes.ok) throw new Error('keys failed')
    const keysJson = await keysRes.json()
    const chunkPromises = (keysJson?.keys || []).map(async (key: string) => {
      const chunkNumber = key.split(':').pop()
      const url = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-products&key=chunk:${chunkNumber}`
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(1200) })
        if (r.ok) {
          const j = await r.json()
          if (Array.isArray(j?.data)) return j.data.map(mapRecordToProduct)
        }
      } catch {}
      return []
    })
    const chunks = await Promise.all(chunkPromises)
    const products = chunks.flat()
    if (products.length) return products
  } catch {}

  return generateProducts(50)
}

async function fetchRealPinsOrFallback(): Promise<Pin[]> {
  try {
    console.log('📌 Dashboard: Fetching real Pinterest pins data...')
    const totalChunks = await getTotalChunks()
    const allPins: Pin[] = []
    
    // Load all chunks to get real pin count
    for (let i = 0; i < totalChunks; i++) {
      try {
        const { pins } = await getPinsForPage(i + 1)
        if (pins && pins.length > 0) {
          // Validate real Pinterest data
          const validPins = pins.filter(pin => 
            pin.id && 
            pin.id.length > 5 && 
            !pin.id.startsWith('pin-')
          )
          allPins.push(...validPins)
        }
      } catch (e) {
        console.warn(`Dashboard: Failed to load pins chunk ${i + 1}:`, e)
      }
    }
    
    if (allPins.length > 0) {
      console.log(`✅ Dashboard: Loaded ${allPins.length} real Pinterest pins`)
      return allPins
    }
  } catch (error) {
    console.warn('Dashboard: Error fetching real Pinterest pins:', error)
  }
  
  // Fallback to generated data only if no real data available
  console.warn('⚠️ Dashboard: Using fallback generated pins data')
  return generatePins(0) // Return empty array instead of sample data
}

async function fetchRealBoardsOrFallback(): Promise<Board[]> {
  try {
    console.log('📋 Dashboard: Fetching real Pinterest boards data...')
    const boards = await fetchBoards()
    
    if (boards && boards.length > 0) {
      console.log(`✅ Dashboard: Loaded ${boards.length} real Pinterest boards`)
      return boards
    }
  } catch (error) {
    console.warn('Dashboard: Error fetching real Pinterest boards:', error)
  }
  
  // Fallback to empty array if no real data available
  console.warn('⚠️ Dashboard: No real boards data available')
  return []
}

async function fetchRealDesignsOrFallback(): Promise<Design[]> {
  try {
    console.log('🎨 Dashboard: Fetching real design library data...')
    // For now, we'll use generated data since design library doesn't have a real API yet
    // This can be updated when the design library API is available
    const designs = generateDesigns(60)
    console.log(`✅ Dashboard: Loaded ${designs.length} designs (generated for now)`)
    return designs
  } catch (error) {
    console.warn('Dashboard: Error fetching designs:', error)
    return []
  }
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [products, orders, pins, boards, designs] = await Promise.all([
          fetchProductsOrFallback(),
          getTransformedOrders().catch(() => [] as Order[]),
          fetchRealPinsOrFallback(),
          fetchRealBoardsOrFallback(),
          fetchRealDesignsOrFallback(),
        ])

        const totals = {
          products: products.length,
          orders: orders.length,
          pins: pins.length,
          boards: boards.length,
          designs: designs.length,
          sales: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        }

        const topProducts = [...products]
          .sort((a, b) => (b.price * (b.inventoryQuantity || 0)) - (a.price * (a.inventoryQuantity || 0)))
          .slice(0, 4)
          .map(p => ({ name: p.title, units: p.inventoryQuantity || 0, revenue: Math.round((p.price || 0) * (p.inventoryQuantity || 0)) }))

        const payload: DashboardData = {
          products,
          orders,
          pins,
          boards,
          designs,
          topProducts,
          totals,
        }

        if (mounted) setData(payload)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const memo = useMemo(() => ({ loading, data }), [loading, data])
  return memo
}


