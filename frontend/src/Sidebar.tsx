import './Sidebar.css'
import type { Message } from './api/types'

type SidebarProps = {
  search: string
  messages: Message[]
  onSearchChange: (value: string) => void
}

function Sidebar({ search, messages, onSearchChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h2>Orders</h2>
      <label className="sidebar-search">
        <span>Search products</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find a product"
        />
      </label>
      <section className="sidebar-history" aria-labelledby="history-heading">
        <h3 id="history-heading">History</h3>
        {messages.length ? (
          <ul>
            {messages.map((message) => (
              <li key={`${message.date}-${message.message}`}>
                <time dateTime={message.date}>{message.date}</time>
                <span>{message.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{search ? 'No matching products' : 'No products yet'}</p>
        )}
      </section>
    </aside>
  )
}

export default Sidebar