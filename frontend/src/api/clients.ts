import axios from 'axios'
import type { LoginResponse, Message } from './types'

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
