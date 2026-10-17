export type Message = {
  date: string
  message: string
}

export type LoginResponse = {
  token: string
  userId: number
  username: string
}

export type MarketGroup = {
  marketGroupId: number
  parentGroupId: number | null
  marketGroupName: string
  description: string | null
  hasTypes: boolean
}

export type InvType = {
  typeId: number
  typeName: string
  description: string | null
  basePrice: number | null
  published: boolean
  marketGroupId: number | null
}

export type MarketOrder = {
  orderId: number
  typeId: number
  locationId: number
  sourceId: number
  side: 'buy' | 'sell'
  price: number
  quantity: number
  quantityInitial: number
  status: 'open' | 'partial' | 'filled' | 'cancelled'
  externalUrl: string | null
  ownerKind: 'user' | 'market_maker' | 'external'
  ownerRef: string | null
  userId: number | null
  expiresAt: string | null
}

export type OrderBook = {
  typeId: number
  buys: MarketOrder[]
  sells: MarketOrder[]
  locationId: number
}

export type MyOrder = {
  orderId: number
  typeId: number
  typeName: string
  price: number
  quantity: number
  quantityInitial: number
  status: MarketOrder['status']
  createdAt: string
}