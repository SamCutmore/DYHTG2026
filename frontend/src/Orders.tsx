import { useEffect, useState } from 'react'
import { getMyOrders } from './api/clients'
import { handleFailure } from './api/errors'
import type { MyOrder } from './api/types'
import { TypeIcon } from './typeIcons'

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
            <caption>Your buy orders, newest first</caption>
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
                  <td>
                    <span className="order-product">
                      <TypeIcon
                        typeId={order.typeId}
                        typeName={order.typeName}
                        size={28}
                      />
                      <span>{order.typeName}</span>
                    </span>
                  </td>
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
