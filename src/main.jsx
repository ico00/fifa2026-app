import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DataProvider, AuthProvider, MatchActionsProvider, useData } from './context'
import { AppErrorBoundary } from './components/ErrorBoundary'

// Wrapper komponenta koja povezuje AuthProvider s DataProvider
function AuthWithDataRefresh({ children }) {
  const { refreshData } = useData()
  
  return (
    <AuthProvider onAuthChange={refreshData}>
      {children}
    </AuthProvider>
  )
}

function AppWithProviders() {
  return (
    <AppErrorBoundary>
      <DataProvider>
        <AuthWithDataRefresh>
          <MatchActionsProvider>
            <App />
          </MatchActionsProvider>
        </AuthWithDataRefresh>
      </DataProvider>
    </AppErrorBoundary>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>,
)
