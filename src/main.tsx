import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { registerSW } from 'virtual:pwa-register'
import { I18nProvider } from '@/i18n'
import { DemoProvider } from '@/state/DemoProvider'
import { router } from '@/router'
import '@/styles/globals.css'

// The offline service worker runs only in production builds. In development, remove any
// worker left over from a previous `npm run preview` so it can't serve stale files.
if (import.meta.env.PROD) {
  registerSW({ immediate: true })
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <DemoProvider>
        <RouterProvider router={router} />
      </DemoProvider>
    </I18nProvider>
  </StrictMode>,
)
