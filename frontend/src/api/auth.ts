import axios from 'axios'

const api = axios.create({ baseURL: '/' })

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  username: string
}

// Backend endpoints do not exist yet; these are the contract to implement.
export async function login(input: LoginInput): Promise<void> {
  await api.post('/api/auth/login', input)
}

export async function register(input: RegisterInput): Promise<void> {
  await api.post('/api/auth/register', input)
}

export function authErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data
    if (typeof data === 'string' && data) return data
    if (e.response?.status === 404) return 'Auth service is not available yet'
    return e.message
  }
  return e instanceof Error ? e.message : 'Request failed'
}
