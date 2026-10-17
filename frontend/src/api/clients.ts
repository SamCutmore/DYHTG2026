import axios from 'axios'
import type { Message } from './types'

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
    params: { q: `readMessages: ${toIso(from)}|${toIso(to)}` },
  })
  return data
}
