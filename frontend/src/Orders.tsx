import axios from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getMyOrders,
  login,
  placeBuyOrder,
  register,
} from './api/clients'
import type { LoginResponse, MyOrder } from './api/types'

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

const statusLabels: Record<MyOrder['status'], string> = {
  open: 'Pending',
  partial: 'Partially filled',
  filled: 'Completed',
  cancelled: 'Cancelled',
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === 'string') {
      return error.response.data
    }
  }
  return error instanceof Error ? error.message : 'Request failed'
}

function handleFailure(
  error: unknown,
  onExpired: () => void,
): string {
  const message = errorMessage(error)
  if (message === 'Unauthorized') {
    onExpired()
  }
  return message
}

export function AccountForm({
  onLogin,
}: {
  onLogin: (session: LoginResponse) => void
}) {
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const name = username.trim()
    setError('')

    if (!name || name.includes(';') || password.includes(';')) {
      setError('Enter a username and password without semicolons.')
      return
    }

    if (creatingAccount && password !== passwordAgain) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      if (creatingAccount) {
        await register(name, password, passwordAgain)
      }
      const session = await login(name, password)
      onLogin(session)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="orders-panel" aria-label="Account">
      <h2>{creatingAccount ? 'Create account' : 'Log in'}</h2>

      <form className="message-form" onSubmit={submit}>
        <label>
          Username
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            autoComplete={
              creatingAccount ? 'new-password' : 'current-password'
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {creatingAccount && (
          <label>
            Confirm password
            <input
              required
              type="password"
              autoComplete="new-password"
              value={passwordAgain}
              onChange={(event) => setPasswordAgain(event.target.value)}
            />
          </label>
        )}

        <button type="submit" disabled={busy}>
          {busy
            ? 'Please wait…'
            : creatingAccount
              ? 'Create account and log in'
              : 'Log in'}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setCreatingAccount((current) => !current)
          setError('')
        }}
      >
        {creatingAccount ? 'Use existing account' : 'Create an account'}
      </button>
    </section>
  )
}

export function BuyOrderForm({
  typeId,
  token,
  onPlaced,
  onExpired,
}: {
  typeId: number
  token: string
  onPlaced: (orderId: number) => void
  onExpired: () => void
}) {
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setError('')
    const unitPrice = Number(price)
    const units = Number(quantity)

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isSafeInteger(units) ||
      units <= 0 ||
      units > 2147483647
    ) {
      setError('Enter a positive price and a whole quantity.')
      return
    }

    setBusy(true)
    try {
      const result = await placeBuyOrder(
        typeId,
        1,
        unitPrice,
        units,
        token,
      )
      onPlaced(result.orderId)
    } catch (failure) {
      setError(handleFailure(failure, onExpired))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="orders-panel">
      <h2>Place a buy order</h2>
      <p>Choose your maximum price per item. Orders use the UK market.</p>

      <form className="message-form" onSubmit={submit}>
        <label>
          Maximum unit price (£)
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>

        <label>
          Quantity
          <input
            required
            type="number"
            min="1"
            max="2147483647"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? 'Placing order…' : 'Place buy order'}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}

export function MyOrders({
  token,
  onExpired,
}: {
  token: string
  onExpired: () => void
}) {
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [filter, setFilter] = useState<'all' | MyOrder['status']>('all')
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setOrders([])

    getMyOrders(token)
      .then((rows) => {
        if (!cancelled) setOrders(rows)
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setError(handleFailure(failure, onExpired))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, refresh, onExpired])

  const visibleOrders = orders.filter(
    (order) => filter === 'all' || order.status === filter,
  )

  return (
    <section className="orders-panel" aria-label="My orders">
      <div className="orders-toolbar">
        <label>
          Status{' '}
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as 'all' | MyOrder['status'])
            }
          >
            <option value="all">All orders</option>
            <option value="open">Pending</option>
            <option value="partial">Partially filled</option>
            <option value="filled">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((current) => current + 1)}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p role="status">Loading orders…</p>
      ) : error ? (
        <p className="error" role="alert">{error}</p>
      ) : visibleOrders.length === 0 ? (
        <p>No orders in this view.</p>
      ) : (
        <div className="orders-table-scroll">
          <table className="orders-table">
            <caption>Your UK buy orders, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Product</th>
                <th scope="col">Limit price</th>
                <th scope="col">Ordered</th>
                <th scope="col">Filled</th>
                <th scope="col">Remaining</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>#{order.orderId}</td>
                  <td>{order.typeName}</td>
                  <td>{currency.format(order.price)}</td>
                  <td>{order.quantityInitial}</td>
                  <td>{order.quantityInitial - order.quantity}</td>
                  <td>{order.quantity}</td>
                  <td>{statusLabels[order.status]}</td>
                  <td>{new Date(order.createdAt).toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}