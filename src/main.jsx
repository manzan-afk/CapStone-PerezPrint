import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import './styles/dashboard-theme.css'
import './styles/dashboard-pro.css'

// A trailing dot in the address (perez-printing-shop.web.app.) is a different host to Firebase
// Auth and breaks Google sign-in, so send visitors to the normal address.
if (window.location.hostname.endsWith('.')) {
  const { protocol, hostname, port, pathname, search, hash } = window.location
  window.location.replace(
    `${protocol}//${hostname.slice(0, -1)}${port ? `:${port}` : ''}${pathname}${search}${hash}`
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
