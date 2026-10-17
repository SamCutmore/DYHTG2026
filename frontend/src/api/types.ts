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
