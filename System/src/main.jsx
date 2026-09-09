// Resumo: ponto de entrada React, aplica BrowserRouter e carrega App.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Registra o Service Worker para suporte PWA/Offline
const updateSW = registerSW({
  onNeedRefresh() {
    // Pode-se adicionar um toast aqui para avisar que há uma nova versão
    if (confirm('Nova versão disponível. Recarregar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('🚀 [PWA] Sistema pronto para uso offline!')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
