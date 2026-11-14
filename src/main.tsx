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
  event.preventDefault()
  reloadOnceForStaleChunk('vite:preloadError')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  </StrictMode>,
)
