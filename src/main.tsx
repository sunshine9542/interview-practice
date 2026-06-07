import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadSettings } from './db'
import { applyLayout, applyTheme } from './utils/theme'

const initialSettings = loadSettings()
applyTheme(initialSettings.theme)
applyLayout(initialSettings.layoutMode)

// 개발 중에는 예전 PWA 서비스워커/캐시가 옛 화면을 서빙하지 않도록 정리
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  })
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
