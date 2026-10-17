import { useState } from 'react'
import { authErrorMessage, login } from './api/auth'
import './Auth.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login({ email: email.trim(), password })
      window.location.hash = '#/'
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Log in</h1>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={busy || !email.trim() || !password}>
          Log in
        </button>
        <p className="switch">
          No account? <a href="#/register">Register</a>
        </p>
        <p className="switch">
          <a href="#/">Back to market</a>
        </p>
      </form>
    </div>
  )
}

export default Login
