import { useEffect, useState } from 'react'
import { getHistory } from './api/clients'
import type { MarketHistory } from './api/types'

const W = 800
const H = 320
const PAD = { top: 20, right: 24, bottom: 44, left: 64 }

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

function PriceHistoryChart({ typeId }: { typeId: number }) {
  const [rows, setRows] = useState<MarketHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getHistory(typeId)
      .then((data) => {
        if (!cancelled) setRows([...data].sort((a, b) => a.date.localeCompare(b.date)))
      })
      .catch(() => {
        if (!cancelled) setError('Could not load price history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [typeId])

  if (loading) return <p>Loading price history…</p>
  if (error) return <p role="alert">{error}</p>
  if (!rows.length) return <p>No price history available.</p>

  const min = Math.min(...rows.map((r) => r.lowPrice))
  const max = Math.max(...rows.map((r) => r.highPrice))
  const span = max - min || 1
  const yMin = min - span * 0.1
  const yMax = max + span * 0.1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i: number) =>
    PAD.left + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH

  const avgPath = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.avgPrice)}`).join(' ')
  const bandPath =
    rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.highPrice)}`).join(' ') +
    ' ' +
    [...rows]
      .map((r, i) => `L${x(i)},${y(r.lowPrice)}`)
      .reverse()
      .join(' ') +
    ' Z'

  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4)
  const active = hover === null ? null : rows[hover]

  return (
    <figure className="price-chart">
      <figcaption>Price history · daily average with low–high range</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price history chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="chart-label">
              {currency.format(t)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => (
          <text key={r.date} x={x(i)} y={H - 16} textAnchor="middle" className="chart-label">
            {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        <path d={bandPath} className="chart-band" />
        <path d={avgPath} className="chart-line" />
        {rows.map((r, i) => (
          <circle
            key={r.date}
            cx={x(i)}
            cy={y(r.avgPrice)}
            r={hover === i ? 7 : 5}
            className="chart-dot"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {active && (
        <p className="chart-tooltip">
          {active.date}: avg {currency.format(active.avgPrice)} (low{' '}
          {currency.format(active.lowPrice)}, high {currency.format(active.highPrice)}) ·{' '}
          {active.volume} sold
        </p>
      )}
    </figure>
  )
}

export default PriceHistoryChart
