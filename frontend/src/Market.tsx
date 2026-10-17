import { useState } from 'react'
import { searchItem } from './api/market'
import type { MarketItem, Order, PricePoint } from './api/types'
import './Market.css'

type Tab = 'orders' | 'history' | 'compare'

const TABS: { id: Tab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'history', label: 'Price history' },
  { id: 'compare', label: 'Compare' },
]

const money = (n: number) => `£${n.toFixed(2)}`

function PriceChart({ points }: { points: PricePoint[] }) {
  const w = 800
  const h = 220
  const pad = 28
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1)
  const y = (p: number) => h - pad - ((p - min) / span) * (h - pad * 2)
  const line = points.map((p, i) => `${x(i)},${y(p.price)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Price history">
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" />
      <text x={pad} y={14} className="chart-label">{money(max)}</text>
      <text x={pad} y={h - 6} className="chart-label">{money(min)}</text>
      <text x={w - pad} y={h - 6} textAnchor="end" className="chart-label">
        {points[points.length - 1].date}
      </text>
    </svg>
  )
}

function OrderTable({ title, tone, orders }: { title: string; tone: string; orders: Order[] }) {
  return (
    <section className={`book ${tone}`}>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Price</th>
            <th>Qty</th>
            <th>Condition</th>
            <th>Source</th>
            <th>{title === 'Sellers' ? 'Seller' : 'Buyer'}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="price">{money(o.price)}</td>
              <td>{o.quantity}</td>
              <td>{o.condition}</td>
              <td>{o.source}</td>
              <td>{o.counterparty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Market() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('orders')
  const [item, setItem] = useState<MarketItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setError(null)
    setBusy(true)
    try {
      setItem(await searchItem(query.trim()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="market">
      <header className="topbar">
        <form className="search" onSubmit={onSearch}>
          <input
            type="search"
            placeholder="Search for an item..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={busy}
          />
          <button type="submit" disabled={busy || !query.trim()}>Search</button>
        </form>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error ? <p className="error">{error}</p> : null}
        {!item ? (
          <p className="empty">Search for an item to view its market.</p>
        ) : (
          <>
            <h1>{item.name}</h1>

            {tab === 'history' ? (
              <section className="panel">
                <h2>Price history (30 days)</h2>
                <PriceChart points={item.history} />
              </section>
            ) : null}

            {tab === 'compare' ? (
              <section className="panel">
                <h2>Compare sources</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Lowest ask</th>
                      <th>Highest bid</th>
                      <th>Spread</th>
                      <th>Listings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.comparison.map((c) => (
                      <tr key={c.source}>
                        <td>{c.source}</td>
                        <td className="price">{money(c.lowestAsk)}</td>
                        <td className="price">{money(c.highestBid)}</td>
                        <td>{money(c.lowestAsk - c.highestBid)}</td>
                        <td>{c.listings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <OrderTable title="Sellers" tone="sell" orders={item.sells} />
            <OrderTable title="Buyers" tone="buy" orders={item.buys} />
          </>
        )}
      </main>
    </div>
  )
}

export default Market
