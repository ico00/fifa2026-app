import { memo, useState } from 'react'

/**
 * Install Prompt - poziva korisnika da instalira app
 */
function InstallPrompt({ 
  isInstallable, 
  isIOS, 
  showIOSInstall, 
  onInstall, 
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(true)

  // Ne prikazuj ako nije installable i nije iOS
  if (!isVisible) return null
  if (!isInstallable && !showIOSInstall) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleInstall = async () => {
    const success = await onInstall?.()
    if (success) {
      setIsVisible(false)
    }
  }

  // iOS upute za instalaciju
  if (showIOSInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[90] animate-slide-up">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📱</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">
                Instaliraj FIFA 2026 App
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Dodaj na početni ekran za brži pristup i offline korištenje!
              </p>
              
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-sm">
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  <strong>Kako instalirati na iOS:</strong>
                </p>
                <ol className="text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Pritisni <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 16L4 20L20 20L20 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Share
                  </span></li>
                  <li>Odaberi "Add to Home Screen"</li>
                  <li>Pritisni "Add"</li>
                </ol>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label="Zatvori"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Možda kasnije
          </button>
        </div>
      </div>
    )
  }

  // Standard install prompt (Chrome, Edge, etc.)
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] animate-slide-up">
      <div className="bg-gradient-to-r from-fifa-blue to-blue-700 rounded-2xl shadow-2xl p-4 max-w-md mx-auto text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
            ⚽
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-0.5">
              Instaliraj FIFA 2026 App
            </h3>
            <p className="text-sm text-white/80">
              Brži pristup i offline podrška
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1"
            aria-label="Zatvori"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 bg-white text-fifa-blue font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <span>📲</span> Instaliraj
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 font-medium rounded-xl transition-colors"
          >
            Kasnije
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(InstallPrompt)
