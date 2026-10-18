import { useMemo, useState } from 'react'
import type { InvType, LoginResponse, PlaceBuyOrderResponse } from './api/types'
import MarketOrders from './MarketOrders'
import PriceHistory from './PriceHistory'
import BuyOrderDialog from './BuyOrderDialog'
import type { BuyOrderDefaults } from './BuyOrderDialog'
import { TypeIcon } from './typeIcons'

type ItemTab = 'data' | 'history'

type ItemWorkspaceProps = {
  type: InvType
  locationId: number
  locationName: string
  locations: {
    locationId: number
    parentLocationId: number | null
    locationName: string
  }[]
  itemTab: ItemTab
  session: LoginResponse | null
  marketVersion: number
  highlightBuyOrderId: number | null
  pinned: boolean
  onItemTabChange: (tab: ItemTab) => void
  onLocationChange: (locationId: number) => void
  onTogglePin: () => void
  onExpired: () => void
  onBuyPlaced: (result: PlaceBuyOrderResponse) => void
  onNeedLogin: () => void
  onHighlightBuyConsumed: () => void
  onOrdersChanged: () => void
  onNotice: (message: string) => void
}

/** One selected catalogue type — keyed by typeId in App so the subtree fully resets on switch. */
export default function ItemWorkspace({
  type,
  locationId,
  locationName,
  locations,
  itemTab,
  session,
  marketVersion,
  highlightBuyOrderId,
  pinned,
  onItemTabChange,
  onLocationChange,
  onTogglePin,
  onExpired,
  onBuyPlaced,
  onNeedLogin,
  onHighlightBuyConsumed,
  onOrdersChanged,
  onNotice,
}: ItemWorkspaceProps) {
  const [buyOpen, setBuyOpen] = useState(false)
  const [buyDefaults, setBuyDefaults] = useState<BuyOrderDefaults | undefined>()

  const locationNames = useMemo(() => {
    const map: Record<number, string> = {}
    for (const loc of locations) {
      map[loc.locationId] = loc.locationName
    }
    return map
  }, [locations])

  function openBuy(defaults?: BuyOrderDefaults) {
    if (!session) {
      onNeedLogin()
      return
    }
    setBuyDefaults(defaults)
    setBuyOpen(true)
  }

  return (
    <section className="item-workspace">
      <div className="item-identity">
        <TypeIcon
          typeId={type.typeId}
          marketGroupId={type.marketGroupId}
          typeName={type.typeName}
          size={64}
          className="type-icon type-icon-lg"
        />
        <div className="item-identity-main">
          <h1>{type.typeName}</h1>
          {type.description ? (
            <div className="item-description" tabIndex={0}>
              {type.description}
            </div>
          ) : (
            <div className="item-description item-description-empty">
              No description.
            </div>
          )}
        </div>
      </div>

      <div className="item-controls">
        <nav className="pane-tabs" aria-label="Item views">
          <button
            type="button"
            className="pane-tab"
            aria-selected={itemTab === 'data'}
            onClick={() => onItemTabChange('data')}
          >
            Market Data
          </button>
          <button
            type="button"
            className="pane-tab"
            aria-selected={itemTab === 'history'}
            onClick={() => onItemTabChange('history')}
          >
            Price History
          </button>
        </nav>

        <label className="item-location">
          Location
          <select
            value={locationId}
            onChange={(event) => onLocationChange(Number(event.target.value))}
          >
            {locations.map((loc) => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.parentLocationId == null
                  ? loc.locationName
                  : `↳ ${loc.locationName}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="item-pane">
        {itemTab === 'data' ? (
          <MarketOrders
            typeId={type.typeId}
            typeName={type.typeName}
            locationId={locationId}
            locations={locations}
            locationNames={locationNames}
            canBuy={Boolean(session)}
            pinned={pinned}
            userId={session?.userId ?? null}
            userName={session?.username ?? null}
            token={session?.token ?? null}
            refreshToken={marketVersion}
            highlightBuyOrderId={highlightBuyOrderId}
            onBuyFromAsk={(defaults) => openBuy(defaults)}
            onNeedLogin={onNeedLogin}
            onHighlightBuyConsumed={onHighlightBuyConsumed}
            onPlaceBuy={() => openBuy()}
            onTogglePin={onTogglePin}
            onExpired={onExpired}
            onOrdersChanged={onOrdersChanged}
            onNotice={onNotice}
          />
        ) : (
          <PriceHistory typeId={type.typeId} locationId={locationId} />
        )}
      </div>

      {buyOpen && session ? (
        <BuyOrderDialog
          typeId={type.typeId}
          typeName={type.typeName}
          locationId={locationId}
          locationName={locationName}
          token={session.token}
          defaults={buyDefaults}
          onClose={() => {
            setBuyOpen(false)
            setBuyDefaults(undefined)
          }}
          onExpired={onExpired}
          onPlaced={(result) => {
            setBuyOpen(false)
            setBuyDefaults(undefined)
            onBuyPlaced(result)
          }}
        />
      ) : null}
    </section>
  )
}
