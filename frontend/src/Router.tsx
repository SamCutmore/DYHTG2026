import { useEffect, useState } from 'react'
import Login from './Login'
import Market from './Market'
import Register from './Register'

const currentRoute = () => window.location.hash.replace(/^#/, '') || '/'

function Router() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  if (route === '/login') return <Login />
  if (route === '/register') return <Register />
  return <Market />
}

export default Router
