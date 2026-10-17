import { useState } from 'react'
import { authErrorMessage, register } from './api/auth'
import './Auth.css'

const MIN_PASSWORD = 8

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      await register({ username: username.trim(), email: email.trim(), password })
      window.location.hash = '#/login'
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Register</h1>
        <label>
          Username
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !username.trim() || !email.trim() || !password || !confirm}
        >
          Create account
        </button>
        <p className="switch">
          Already registered? <a href="#/login">Log in</a>
        </p>
        <p className="switch">
          <a href="#/">Back to market</a>
        </p>
      </form>
    </div>
  )
}

export default Register
