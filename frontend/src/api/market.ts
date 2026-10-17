import type { MarketItem } from './types'

// Mock data until the backend exposes market endpoints.
const SOURCES = ['eBay', 'Vinted', 'Gumtree']

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function hash(text: string): number {
  let h = 7
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 100000
  return h
}

export async function searchItem(query: string): Promise<MarketItem> {
  const rand = seeded(hash(query.toLowerCase()))
  const base = 40 + Math.round(rand() * 300)

  const orders = (side: 'sell' | 'buy') =>
    Array.from({ length: 8 }, (_, i) => {
      const drift = (i + 1) * (0.012 + rand() * 0.01)
      const price = side === 'sell' ? base * (1 + drift) : base * (1 - drift)
      return {
        id: `${side}-${i}`,
        counterparty: `${side === 'sell' ? 'seller' : 'buyer'}_${Math.floor(rand() * 9000 + 1000)}`,
        source: SOURCES[Math.floor(rand() * SOURCES.length)],
        condition: ['New', 'Like new', 'Good', 'Fair'][Math.floor(rand() * 4)],
        price: Math.round(price * 100) / 100,
        quantity: Math.floor(rand() * 5) + 1,
        placed: new Date(Date.now() - Math.floor(rand() * 14 * 24 * 60) * 60_000).toISOString(),
      }
    })

  const now = Date.now()
  let price = base
  const history = Array.from({ length: 30 }, (_, i) => {
    price = Math.max(5, price * (1 + (rand() - 0.5) * 0.08))
    return {
      date: new Date(now - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      price: Math.round(price * 100) / 100,
    }
  })

  const sells = orders('sell').sort((a, b) => a.price - b.price)
  const buys = orders('buy').sort((a, b) => b.price - a.price)

  const comparison = SOURCES.map((source) => {
    const ofSource = sells.filter((o) => o.source === source)
    const lowest = base * (0.9 + rand() * 0.2)
    return {
      source,
      lowestAsk: Math.round(lowest * 100) / 100,
      highestBid: Math.round(lowest * (0.85 + rand() * 0.1) * 100) / 100,
      listings: ofSource.length + Math.floor(rand() * 20),
    }
  })

  return { name: query, sells, buys, history, comparison }
}
