import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { DevAuthWrapper } from './components/auth/DevAuthWrapper'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DevAuthWrapper>
        <App />
      </DevAuthWrapper>
    </QueryClientProvider>
  </StrictMode>,
)
