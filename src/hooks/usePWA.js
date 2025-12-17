import { useState, useEffect, useCallback } from 'react'
import { 
  registerServiceWorker, 
  isPWAInstalled, 
  isIOS, 
  isIOSSafari,
  isOnline 
} from '../utils/pwa'

/**
 * Custom hook za PWA funkcionalnosti
 * 
 * Vraća:
 * - isOnline: boolean - da li je korisnik online
 * - isInstalled: boolean - da li je app instaliran kao PWA
 * - isInstallable: boolean - da li se app može instalirati
 * - isIOS: boolean - da li je uređaj iOS
 * - showIOSInstall: boolean - da li prikazati iOS install upute
 * - installPrompt: function - pokreni install prompt
 * - dismissInstall: function - odbaci install prompt
 * - updateAvailable: boolean - da li je dostupna nova verzija
 * - updateApp: function - ažuriraj app na novu verziju
 */
export function usePWA() {
  const [online, setOnline] = useState(isOnline())
  const [installed, setInstalled] = useState(isPWAInstalled())
  const [installable, setInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSInstall, setShowIOSInstall] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [swRegistration, setSwRegistration] = useState(null)
  const [installDismissed, setInstallDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === 'true'
  })

  // Registriraj Service Worker
  useEffect(() => {
    registerServiceWorker().then((registration) => {
      if (registration) {
        setSwRegistration(registration)
      }
    })
  }, [])

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      console.log('🟢 Online')
    }
    
    const handleOffline = () => {
      setOnline(false)
      console.log('🔴 Offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Install prompt listener (Chrome, Edge, etc.)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Spriječi automatski prompt
      e.preventDefault()
      // Spremi event za kasnije
      setDeferredPrompt(e)
      setInstallable(true)
      console.log('📱 App je instalabilan')
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setInstallable(false)
      setDeferredPrompt(null)
      console.log('✅ App instaliran!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // iOS detection - prikaži upute za iOS korisnike
  useEffect(() => {
    if (isIOSSafari() && !isPWAInstalled() && !installDismissed) {
      // Pričekaj malo prije prikaza
      const timer = setTimeout(() => {
        setShowIOSInstall(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [installDismissed])

  // Service Worker update listener
  useEffect(() => {
    const handleSWUpdate = (event) => {
      setUpdateAvailable(true)
      setSwRegistration(event.detail)
    }

    window.addEventListener('swUpdate', handleSWUpdate)
    return () => window.removeEventListener('swUpdate', handleSWUpdate)
  }, [])

  // Display mode change listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    
    const handleChange = (e) => {
      setInstalled(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Install prompt funkcija
  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('⚠️ Install prompt nije dostupan')
      return false
    }

    // Prikaži prompt
    deferredPrompt.prompt()

    // Čekaj korisnikov odgovor
    const { outcome } = await deferredPrompt.userChoice
    console.log(`📱 Install prompt outcome: ${outcome}`)

    // Očisti deferred prompt
    setDeferredPrompt(null)
    setInstallable(false)

    return outcome === 'accepted'
  }, [deferredPrompt])

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setInstallDismissed(true)
    setShowIOSInstall(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }, [])

  // Reset install dismissed (za testiranje)
  const resetInstallDismissed = useCallback(() => {
    setInstallDismissed(false)
    localStorage.removeItem('pwa-install-dismissed')
  }, [])

  // Update app
  const updateApp = useCallback(() => {
    if (swRegistration?.waiting) {
      // Pošalji poruku Service Workeru da se aktivira
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Osvježi stranicu nakon aktivacije
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [swRegistration])

  return {
    // Status
    isOnline: online,
    isInstalled: installed,
    isInstallable: installable && !installDismissed && !installed,
    isIOS: isIOS(),
    showIOSInstall: showIOSInstall && !installDismissed,
    updateAvailable,
    
    // Actions
    installPrompt,
    dismissInstall,
    resetInstallDismissed,
    updateApp
  }
}

export default usePWA
