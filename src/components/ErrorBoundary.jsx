import { Component } from 'react'

/**
 * Generička ErrorBoundary komponenta
 * Hvata JavaScript greške u child komponentama i prikazuje fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Ažuriraj state tako da sljedeći renderiranje prikaže fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Možeš logirati grešku na error reporting servis
    console.error('🚨 ErrorBoundary uhvatio grešku:', error)
    console.error('📍 Stack trace:', errorInfo.componentStack)
    
    this.setState({ errorInfo })

    // Ovdje možeš dodati integraciju s error tracking servisom
    // npr. Sentry, LogRocket, etc.
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Koristi custom fallback ako je proslijeđen
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Koristi FallbackComponent ako je proslijeđen
      if (this.props.FallbackComponent) {
        return (
          <this.props.FallbackComponent 
            error={this.state.error}
            resetError={this.handleRetry}
          />
        )
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          title={this.props.title || 'Došlo je do greške'}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default fallback UI komponenta
 */
function DefaultErrorFallback({ error, errorInfo, onRetry, title, showDetails = false }) {
  const isDev = import.meta.env.DEV

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900 shadow-lg">
      <div className="text-6xl mb-4">😕</div>
      <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-center mb-4 max-w-md">
        Nešto je pošlo po zlu. Molimo pokušajte ponovno ili osvježite stranicu.
      </p>
      
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-fifa-blue hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Pokušaj ponovno
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <span>↻</span> Osvježi stranicu
        </button>
      </div>

      {/* Prikaži detalje greške samo u developmentu ili ako je eksplicitno zatraženo */}
      {(isDev || showDetails) && error && (
        <details className="mt-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
            🔍 Detalji greške (za developere)
          </summary>
          <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto">
            <p className="text-red-600 dark:text-red-400 font-mono text-sm mb-2">
              {error.toString()}
            </p>
            {errorInfo && (
              <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

/**
 * Wrapper za sekcije aplikacije s prilagođenim porukama
 */
export function TabErrorBoundary({ children, tabName }) {
  return (
    <ErrorBoundary 
      title={`Greška u sekciji "${tabName}"`}
      FallbackComponent={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">
            Ups! Nešto nije u redu
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-md">
            Sekcija <span className="font-semibold text-fifa-blue dark:text-fifa-gold">{tabName}</span> se nije mogla učitati.
            Pokušajte ponovno ili odaberite drugu sekciju.
          </p>
          <button
            onClick={resetError}
            className="px-8 py-3 bg-gradient-to-r from-fifa-blue to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <span>🔄</span> Pokušaj ponovno
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Wrapper za cijelu aplikaciju
 */
export function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ resetError }) => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white px-4">
          <div className="text-8xl mb-6 animate-bounce">⚽</div>
          <h1 className="text-3xl md:text-4xl font-black text-fifa-gold mb-4 text-center">
            Greška u aplikaciji
          </h1>
          <p className="text-slate-300 text-center mb-8 max-w-md">
            Došlo je do neočekivane greške. Molimo osvježite stranicu ili pokušajte ponovno kasnije.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={resetError}
              className="px-8 py-3 bg-fifa-gold hover:bg-yellow-500 text-slate-900 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <span>🔄</span> Pokušaj ponovno
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <span>↻</span> Osvježi stranicu
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Wrapper za komponente koje učitavaju podatke
 */
export function DataErrorBoundary({ children, dataName = 'podatke' }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ resetError }) => (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="text-4xl mb-3">📊</div>
          <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
            Nije moguće učitati {dataName}
          </h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm text-center mb-4">
            Provjerite internetsku vezu i pokušajte ponovno.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Pokušaj ponovno
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
