import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Hay una nueva versión de AquaGest. ¿Deseas actualizar?")) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log("App lista para funcionar sin conexión.")
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
