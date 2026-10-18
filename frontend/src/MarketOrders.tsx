import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { getMarketPrice, getOrderBook } from './api/clients'
import type { MarketOrder, MarketPrice } from './api/types'
import type { BuyOrderDefaults } from './BuyOrderDialog'

const sources: Record<number, string> = {
  1: 'eBay',
  2: 'Vinted',
  3: 'Gumtree',
  4: 'Facebook Marketplace',
  5: 'Amazon',
  6: 'Market Maker',
}

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

const statusLabels: Record<MarketOrder['status'], string> = {
  open: 'Open',
  partial: 'Partial',
  filled: 'Filled',
  cancelled: 'Cancelled',
}

type ContextMenuState = {
  x: number
  y: number
  offer: MarketOrder
}

export default function MarketOrders({
  typeId,
  locationId,
  locationName,
  locationNames,
  canBuy,
  refreshToken = 0,
  highlightBuyOrderId = null,
  onBuyFromAsk,
  onNeedLogin,
  onHighlightBuyConsumed,
}: {
  typeId: number
  locationId: number
  locationName: string
  locationNames: Record<number, string>
  canBuy: boolean
  /** Bump to reload the book without remounting the whole page. */
  refreshToken?: number
  /** After placeBuyOrder — flash this row if it appears in the buy book. */
  highlightBuyOrderId?: number | null
  onBuyFromAsk: (defaults: BuyOrderDefaults) => void
  onNeedLogin: () => void
  onHighlightBuyConsumed?: () => void
}) {
  const [sells, setSells] = useState<MarketOrder[]>([])
  const [buys, setBuys] = useState<MarketOrder[]>([])
  const [price, setPrice] = useState<MarketPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const requestKey = `${typeId}:${locationId}:${refreshToken}`

  useEffect(() => {
    let cancelled = false
    const key = requestKey

    setLoading(true)
    setError(null)
    setSells([])
    setBuys([])
    setPrice(null)
    setLoadedKey(null)
    setMenu(null)

    Promise.all([
      getOrderBook(typeId, locationId),
      getMarketPrice(typeId, locationId).catch(() => null),
    ])
      .then(([book, marketPrice]) => {
        if (cancelled) return
        setSells([...book.sells].sort((a, b) => a.price - b.price))
        setBuys([...book.buys].sort((a, b) => b.price - a.price))
        setPrice(marketPrice)
        setLoadedKey(key)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load market data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [typeId, locationId, refreshToken, requestKey])

  useEffect(() => {
    if (!menu) return

    function close() {
      setMenu(null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const ready = !loading && !error && loadedKey === requestKey

  useEffect(() => {
    if (!ready || highlightBuyOrderId == null) return
    const present = buys.some((offer) => offer.orderId === highlightBuyOrderId)
    if (!present) {
      onHighlightBuyConsumed?.()
    }
  }, [ready, buys, highlightBuyOrderId, onHighlightBuyConsumed])

  function openSellerMenu(
    event: ReactMouseEvent,
    offer: MarketOrder,
  ) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, offer })
  }

  function listingUrl(offer: MarketOrder): string | null {
    if (offer.externalUrl && /^https?:\/\//i.test(offer.externalUrl)) {
      return offer.externalUrl
    }
    return null
  }

  return (
    <div className="market-data">
      {loading ? <p>Loading market data…</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {ready ? (
        <>
          {price && price.sampleSize > 0 ? (
            <p className="market-price-summary">
              {locationName}: lowest ask{' '}
              {price.lowestPrice != null
                ? currency.format(price.lowestPrice)
                : '—'}
              , median ask{' '}
              {price.medianPrice != null
                ? currency.format(price.medianPrice)
                : '—'}{' '}
              ({price.sampleSize} open sell
              {price.sampleSize === 1 ? '' : 's'})
            </p>
          ) : (
            <p className="market-price-summary">
              {locationName}: no cached ask stats yet (open sells may still
              appear below).
            </p>
          )}

          <div className="market-books">
            <OrderTable
              caption={`${locationName} · cheapest first · right-click a row`}
              heading="Sellers"
              empty="No sell orders."
              offers={sells}
              locationNames={locationNames}
              side="sell"
              onRowContextMenu={openSellerMenu}
            />

            <OrderTable
              caption={`${locationName} · highest first`}
              heading="Buyers"
              empty="No buy orders."
              offers={buys}
              locationNames={locationNames}
              side="buy"
              highlightOrderId={highlightBuyOrderId}
              onHighlightEnd={onHighlightBuyConsumed}
            />
          </div>
        </>
      ) : null}

      {menu ? (
        <ul
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const offer = menu.offer
                setMenu(null)
                if (!canBuy) {
                  onNeedLogin()
                  return
                }
                onBuyFromAsk({
                  price: String(offer.price),
                  quantity: String(offer.quantity),
                })
              }}
            >
              Create buy order…
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              disabled={!listingUrl(menu.offer)}
              onClick={() => {
                const url = listingUrl(menu.offer)
                setMenu(null)
                if (url) {
                  window.open(url, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              Open listing
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

function OrderTable({
  caption,
  heading,
  empty,
  offers,
  locationNames,
  side,
  highlightOrderId = null,
  onRowContextMenu,
  onHighlightEnd,
}: {
  caption: string
  heading: string
  empty: string
  offers: MarketOrder[]
  locationNames: Record<number, string>
  side: 'buy' | 'sell'
  highlightOrderId?: number | null
  onRowContextMenu?: (
    event: ReactMouseEvent,
    offer: MarketOrder,
  ) => void
  onHighlightEnd?: () => void
}) {
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    if (highlightOrderId == null) return
    highlightRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [highlightOrderId, offers])

  return (
    <section className="market-data-section">
      <h3>{heading}</h3>
      {!offers.length ? (
        <p>{empty}</p>
      ) : (
        <>
          <p className="market-table-caption">{caption}</p>
          <div className="market-table-scroll">
            <table>
              <thead>
                <tr>
                <th scope="col">Price</th>
                <th scope="col">Qty</th>
                <th scope="col">Location</th>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const flashing =
                    highlightOrderId != null &&
                    offer.orderId === highlightOrderId
                  const classes = [
                    side === 'sell' ? 'market-row-interactive' : '',
                    flashing ? 'row-flash' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <tr
                      key={offer.orderId}
                      ref={flashing ? highlightRef : undefined}
                      className={classes || undefined}
                      onAnimationEnd={
                        flashing
                          ? (event) => {
                              if (event.target === event.currentTarget) {
                                onHighlightEnd?.()
                              }
                            }
                          : undefined
                      }
                      onContextMenu={
                        onRowContextMenu
                          ? (event) => onRowContextMenu(event, offer)
                          : undefined
                      }
                    >
                      <td>{currency.format(offer.price)}</td>
                      <td>{offer.quantity}</td>
                      <td>
                        {locationNames[offer.locationId] ??
                          `Location ${offer.locationId}`}
                      </td>
                      <td>{sources[offer.sourceId] ?? 'Other'}</td>
                      <td>{statusLabels[offer.status]}</td>
                      <td>
                        {new Date(offer.updatedAt).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
