import { useState } from 'react'
import { readMessages, sendMessage } from './api/clients'
import type { Message } from './api/types'
import Sidebar from './Sidebar.tsx'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const filteredMessages = messages.filter((row) =>
    row.message.toLowerCase().includes(search.trim().toLowerCase()),
  )

  async function onSend() {
    setError(null)
    setBusy(true)
    try {
      await sendMessage(text)
      setText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setBusy(false)
    }
  }

  async function onRetrieve() {
    setError(null)
    setBusy(true)
    try {
      const rows = await readMessages(from, to)
      setMessages(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retrieve failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        search={search}
        messages={filteredMessages}
        onSearchChange={setSearch}
      />

      <main id="center">
        <h1>Orders</h1>

        <div className="message-form">
          <label>
            Search order here
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
            />
          </label>
          <button type="button" onClick={onSend} disabled={busy || !text.trim()}>
            Search
          </button>
        </div>

        <div className="message-form">
          <label>
            From
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            To
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={busy}
            />
          </label>
          <button
            type="button"
            onClick={onRetrieve}
            disabled={busy || !from || !to}
          >
            Retrieve
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <ul className="messages">
          {filteredMessages.map((row) => (
            <li key={`${row.date}-${row.message}`}>{row.message}</li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default App
