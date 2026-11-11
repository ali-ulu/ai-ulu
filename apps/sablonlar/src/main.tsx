import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The vortex background is shared with the marketing site and served from the
// origin root by the root build, so load it at runtime instead of bundling it.
const vortex = document.createElement('script')
vortex.type = 'module'
vortex.src = '/vortex.js'
document.body.appendChild(vortex)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
