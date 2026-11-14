import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRouter } from '@/app/router'
import { reloadOnceForStaleChunk } from '@/lib/chunkLoadRecovery'
import '@/styles/globals.css'

// Tras deploy, Vite dispara esto cuando un preload de chunk falla.
// No limpiar el flag aquí: si el boot falla otra vez, evita loop infinito.
window.addEventListener('vite:preloadError', (event) => {
  // #region agent log
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '06df44',
    },
    body: JSON.stringify({
      sessionId: '06df44',
      runId: 'post-fix',
      hypothesisId: 'A',
      location: 'main.tsx:vite:preloadError',
      message: 'vite preloadError fired',
      data: {
        type: event.type,
        href: window.location.href,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  event.preventDefault()
  reloadOnceForStaleChunk('vite:preloadError')
})

// #region agent log
fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': '06df44',
  },
  body: JSON.stringify({
    sessionId: '06df44',
    runId: 'post-fix',
    hypothesisId: 'B',
    location: 'main.tsx:boot',
    message: 'app boot',
    data: { href: typeof window !== 'undefined' ? window.location.href : '' },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  </StrictMode>,
)
