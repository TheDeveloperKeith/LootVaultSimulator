import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/vault-theme.css'
import App from './App.jsx'

const root = document.getElementById('root')
if (!root) throw new Error('LootVault root element is missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
