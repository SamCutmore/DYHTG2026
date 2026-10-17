export type Message = {
  date: string
  message: string
}

export type Order = {
  id: string
  counterparty: string
  source: string
  condition: string
  price: number
  quantity: number
}

export type PricePoint = {
  date: string
  price: number
}

export type SourceComparison = {
  source: string
  lowestAsk: number
  highestBid: number
  listings: number
}

export type MarketItem = {
  name: string
  sells: Order[]
  buys: Order[]
  history: PricePoint[]
  comparison: SourceComparison[]
}
