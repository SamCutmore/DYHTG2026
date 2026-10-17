import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Market from './Market.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Market />
  </StrictMode>,
)
