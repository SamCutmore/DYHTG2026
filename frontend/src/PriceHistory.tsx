import { useEffect, useMemo, useState } from 'react'
import { getHistory } from './api/clients'
import type { MarketHistory } from './api/types'

const W = 840
const H = 360
const PAD = { top: 18, right: 20, bottom: 56, left: 64 }
const VOL_H = 56

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

const volumeFmt = new Intl.NumberFormat('en-GB')

function PriceHistory({
  typeId,
  locationId,
}: {
  typeId: number
  locationId: number
}) {
  const [rows, setRows] = useState<MarketHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [windowDays, setWindowDays] = useState(30)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getHistory(typeId, locationId)
      .then((data) => {
        if (!cancelled) {
          setRows([...data].sort((a, b) => a.date.localeCompare(b.date)))
        }
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
  }, [typeId, locationId])

  const maxDays = Math.max(rows.length, 1)
  const clampedWindow = Math.min(windowDays, maxDays)

  const visible = useMemo(() => {
    if (!rows.length) return []
    return rows.slice(-clampedWindow)
  }, [rows, clampedWindow])

  useEffect(() => {
    if (rows.length > 0 && windowDays > rows.length) {
      setWindowDays(rows.length)
    }
  }, [rows.length, windowDays])

  if (loading) return <p>Loading price history…</p>
  if (error) return <p role="alert">{error}</p>
  if (!rows.length) return <p>No price history available.</p>

  const min = Math.min(...visible.map((r) => r.lowPrice))
  const max = Math.max(...visible.map((r) => r.highPrice))
  const span = max - min || 1
  const yMin = min - span * 0.1
  const yMax = max + span * 0.1
  const innerW = W - PAD.left - PAD.right
  const priceH = H - PAD.top - PAD.bottom - VOL_H - 12
  const volTop = PAD.top + priceH + 10
  const maxVol = Math.max(...visible.map((r) => r.volume), 1)

  const x = (i: number) =>
    PAD.left +
    (visible.length === 1 ? innerW / 2 : (i / (visible.length - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * priceH
  const barW = Math.max(
    3,
    Math.min(14, (innerW / Math.max(visible.length, 1)) * 0.55),
  )

  const avgPath = visible
    .map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.avgPrice)}`)
    .join(' ')
  const bandPath =
    visible.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.highPrice)}`).join(' ') +
    ' ' +
    [...visible]
      .map((r, i) => `L${x(i)},${y(r.lowPrice)}`)
      .reverse()
      .join(' ') +
    ' Z'

  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4)
  const active = hover === null ? null : visible[hover]
  const labelStep = Math.max(1, Math.ceil(visible.length / 7))

  return (
    <figure className="price-chart">
      <div className="price-chart-toolbar">
        <figcaption>
          Price history · average with low–high range and volume
        </figcaption>
        <label className="price-window">
          <span>
            Last {clampedWindow} day{clampedWindow === 1 ? '' : 's'}
          </span>
          <input
            type="range"
            min={1}
            max={maxDays}
            step={1}
            value={clampedWindow}
            onChange={(event) => setWindowDays(Number(event.target.value))}
            aria-label="History time period in days"
          />
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price history chart">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="chart-grid"
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              className="chart-label"
            >
              {currency.format(t)}
            </text>
          </g>
        ))}

        <path d={bandPath} className="chart-band" />
        <path d={avgPath} className="chart-line" />

        {visible.map((r, i) => {
          const bh = (r.volume / maxVol) * VOL_H
          return (
            <g key={`vol-${r.date}`}>
              <rect
                x={x(i) - barW / 2}
                y={volTop + VOL_H - bh}
                width={barW}
                height={bh}
                className={
                  hover === i ? 'chart-volume is-active' : 'chart-volume'
                }
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {r.date}: {volumeFmt.format(r.volume)} sold
                </title>
              </rect>
            </g>
          )
        })}

        {visible.map((r, i) =>
          i % labelStep === 0 || i === visible.length - 1 ? (
            <text
              key={`d-${r.date}`}
              x={x(i)}
              y={H - 14}
              textAnchor="middle"
              className="chart-label"
            >
              {new Date(r.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </text>
          ) : null,
        )}

        {visible.map((r, i) => (
          <circle
            key={`dot-${r.date}`}
            cx={x(i)}
            cy={y(r.avgPrice)}
            r={hover === i ? 6 : 4}
            className="chart-dot"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <title>
              {r.date}: {volumeFmt.format(r.volume)} sold
            </title>
          </circle>
        ))}

        <text
          x={PAD.left}
          y={volTop - 2}
          className="chart-label chart-volume-label"
        >
          Volume
        </text>
      </svg>

      {active ? (
        <p className="chart-tooltip">
          {active.date}: avg {currency.format(active.avgPrice)} (low{' '}
          {currency.format(active.lowPrice)}, high{' '}
          {currency.format(active.highPrice)}) ·{' '}
          <strong>{volumeFmt.format(active.volume)} sold</strong>
        </p>
      ) : (
        <p className="chart-tooltip chart-tooltip-hint">
          Hover a pip or volume bar for total volume sold that day.
        </p>
      )}
    </figure>
  )
}

export default PriceHistory
