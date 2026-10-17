import { useEffect, useState } from 'react'
import { getOrderBook } from './api/clients'
import type { MarketOrder } from './api/types'

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

export default function ProductComparison({
  typeId,
}: {
  typeId: number
}) {
  const [offers, setOffers] = useState<MarketOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)
    setOffers([])

    getOrderBook(typeId)
      .then((book) => {
        if (!cancelled) {
          setOffers(
            [...book.sells].sort((a, b) => a.price - b.price),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load offers.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [typeId])

  if (loading) return <p>Loading offers…</p>
  if (error) return <p role="alert">{error}</p>
  if (!offers.length) return <p>No offers available.</p>

  return (
    <table>
      <caption>UK offers, cheapest first · Demo data</caption>
      <thead>
        <tr>
          <th scope="col">Marketplace</th>
          <th scope="col">Listed price</th>
          <th scope="col">Available</th>
          <th scope="col">Listing</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => {
          const validLink =
            offer.externalUrl &&
            /^https?:\/\//i.test(offer.externalUrl)

          return (
            <tr key={offer.orderId}>
              <td>
                {sources[offer.sourceId] ?? 'Other source'}
              </td>
              <td>{currency.format(offer.price)}</td>
              <td>{offer.quantity}</td>
              <td>
                {validLink ? (
                  <a
                    href={offer.externalUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View listing
                  </a>
                ) : (
                  'Unavailable'
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}