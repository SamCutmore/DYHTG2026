import { useState } from 'react'
import { readMessages, sendMessage } from './api/clients'
import type { Message } from './api/types'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    <section id="center">
      <h1>Messages</h1>

      <div className="message-form">
        <label>
          Message
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
        </label>
        <button type="button" onClick={onSend} disabled={busy || !text.trim()}>
          Send
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

      <table className="messages">
        <thead>
          <tr>
            <th>Date</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((row) => (
            <tr key={`${row.date}-${row.message}`}>
              <td>{row.date}</td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default App
