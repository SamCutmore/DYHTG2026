import axios from 'axios'
import type {
  InvType,
  LoginResponse,
  MarketGroup,
  MarketHistory,
  MarketOrder,
  Message,
  MyOrder,
  MyTransaction,
  OrderBook,
} from './types'

const api = axios.create({ baseURL: '/' })

export async function sendMessage(message: string): Promise<void> {
  await api.post('/api', null, {
    params: { q: `sendMessage: ${message}` },
  })
}

function toIso(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toISOString()
}

export async function readMessages(from: string, to: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/api', {
    params: { q: `readMessages: ${toIso(from)};${toIso(to)}` },
  })
  return data
}

export async function register(
  username: string,
  password: string,
  passwordAgain: string,
): Promise<void> {
  const { data } = await api.post<string>('/api', null, {
    params: { q: `register: ${username};${password};${passwordAgain}` },
  })
  if (data !== 'OK') {
    throw new Error('Registration failed')
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse | string>('/api', null, {
    params: { q: `login: ${username};${password}` },
  })
  if (typeof data === 'string' || !data?.token) {
    throw new Error('Login failed')
  }
  return data
}

export async function logout(token: string): Promise<void> {
  const { data } = await api.post<string>('/api', null, {
    params: { q: `logout: ${token}` },
  })
  if (data !== 'OK') {
    throw new Error('Logout failed')
  }
}

export async function listMarketGroups(
  parent: 'root' | number = 'root',
): Promise<MarketGroup[]> {
  const { data } = await api.get<MarketGroup[]>('/api', {
    params: { q: `listMarketGroups: ${parent}` },
  })
  return data
}

export async function listTypes(groupId: number): Promise<InvType[]> {
  const { data } = await api.get<InvType[]>('/api', {
    params: { q: `listTypes: ${groupId}` },
  })
  return data
}

export type PlaceBuyOrderResponse = {
  orderId: number
  fills: number
}

export async function placeBuyOrder(
  typeId: number,
  locationId: number,
  price: number,
  quantity: number,
  token: string,
): Promise<PlaceBuyOrderResponse> {
  const { data } = await api.post<PlaceBuyOrderResponse>('/api', null, {
    params: {
      q: `placeBuyOrder: ${typeId};${locationId};${price};${quantity};${token}`,
    },
  })
  return data
}

export async function getOrderBook( typeId: number, locationId = 1): Promise<OrderBook> { // chose location 1 here is because it is the UK in the seed data, we have getOrderSolver handling this already
  const { data } = await api.get<OrderBook>('/api', {
    params: { q: `getOrderBook: ${typeId};${locationId}` },
  })
  return data
}

export async function getHistory(typeId: number, locationId = 1): Promise<MarketHistory[]> {
  const { data } = await api.get<MarketHistory[]>('/api', {
    params: { q: `getHistory: ${typeId};${locationId}` },
  })
  return data
}

export async function listMyOrders(token: string): Promise<MarketOrder[]> {
  const { data } = await api.get<MarketOrder[]>('/api', {
    params: { q: `listMyOrders: ${token}` },
  })
  return data
}

export async function listMyTransactions(token: string): Promise<MyTransaction[]> {
  const { data } = await api.get<MyTransaction[]>('/api', {
    params: { q: `listMyTransactions: ${token}` },
  })
  return data
}

/** Account UI: all of the user's buy orders (with typeName). */
export async function getMyOrders(token: string): Promise<MyOrder[]> {
  const { data } = await api.get<MyOrder[]>('/api', {
    params: { q: `getMyOrders: ${token}` },
  })
  return data
}