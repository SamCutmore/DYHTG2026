import { useCallback, useState } from 'react'
import type { InvType, LoginResponse } from './api/types'
import { logout } from './api/clients'
import Sidebar from './Sidebar'
import ProductComparison from './ProductComparison'
import PriceHistoryChart from './PriceHistoryChart'
import { AccountForm, BuyOrderForm, MyOrders } from './Orders'
import './App.css'

function App() {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<InvType | null>(null)
  const [session, setSession] = useState<LoginResponse | null>(null)
  const [page, setPage] = useState<'market' | 'orders'>('market')
  const [notice, setNotice] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [marketVersion, setMarketVersion] = useState(0)

  const handleExpired = useCallback(() => {
    setSession(null)
    setNotice('Your session expired. Please log in again.')
  }, [])

  async function handleLogout() {
    if (!session || loggingOut) return

    setLoggingOut(true)
    try {
      await logout(session.token)
      setNotice('Logged out.')
    } catch {
      setNotice(
        'Logged out on this device. The server could not confirm logout.',
      )
    } finally {
      setSession(null)
      setLoggingOut(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        search={search}
        selectedTypeId={selectedType?.typeId ?? null}
        onSearchChange={setSearch}
        onSelectType={(type) => {
          setSelectedType(type)
          setPage('market')
          setNotice('')
        }}
      />

      <main id="center">
        <nav className="orders-toolbar" aria-label="Main navigation">
          <button
            type="button"
            aria-current={page === 'market' ? 'page' : undefined}
            onClick={() => setPage('market')}
          >
            Market
          </button>
          <button
            type="button"
            aria-current={page === 'orders' ? 'page' : undefined}
            onClick={() => setPage('orders')}
          >
            My Orders
          </button>
        </nav>

        {notice && <p role="status">{notice}</p>}

        {session ? (
          <div className="orders-toolbar">
            <span>Logged in as {session.username}</span>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        ) : (
          <AccountForm
            onLogin={(result) => {
              setSession(result)
              setNotice('')
            }}
          />
        )}

        <h1>
          {page === 'orders'
            ? 'My Orders'
            : selectedType?.typeName ?? 'Market'}
        </h1>

        {page === 'orders' ? (
          session ? (
            <MyOrders
              key={session.userId}
              token={session.token}
              onExpired={handleExpired}
            />
          ) : (
            <p>Log in to view your orders.</p>
          )
        ) : selectedType ? (
          <>
            <ProductComparison
              key={`${selectedType.typeId}-${marketVersion}`}
              typeId={selectedType.typeId}
            />

            <PriceHistoryChart
              key={selectedType.typeId}
              typeId={selectedType.typeId}
            />

            {session ? (
              <BuyOrderForm
                key={`${selectedType.typeId}-${session.userId}`}
                typeId={selectedType.typeId}
                token={session.token}
                onExpired={handleExpired}
                onPlaced={(orderId) => {
                  setMarketVersion((current) => current + 1)
                  setNotice(`Order #${orderId} placed.`)
                  setPage('orders')
                }}
              />
            ) : (
              <p>Log in to place a buy order.</p>
            )}
          </>
        ) : (
          <p>Select a product from the sidebar to compare offers.</p>
        )}
      </main>
    </div>
  )
}

export default App