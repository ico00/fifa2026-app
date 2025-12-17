/**
 * PWA Utilities
 * Registracija Service Workera i upravljanje PWA funkcionalnostima
 */

/**
 * Registriraj Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker nije podržan u ovom pregledniku')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('✅ Service Worker registriran:', registration.scope)

    // Provjeri za update
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      console.log('🔄 Nova verzija Service Workera pronađena')

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova verzija je spremna
          console.log('🆕 Nova verzija dostupna! Osvježite stranicu.')
          
          // Dispatch custom event za UI
          window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }))
        }
      })
    })

    return registration
  } catch (error) {
    console.error('❌ Service Worker registracija neuspješna:', error)
    return null
  }
}

/**
 * Deregistriraj Service Worker (za development)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const success = await registration.unregister()
    console.log('🗑️ Service Worker deregistriran:', success)
    return success
  } catch (error) {
    console.error('❌ Deregistracija neuspješna:', error)
    return false
  }
}

/**
 * Očisti sve PWA cache-ove
 */
export async function clearPWACache() {
  if (!('caches' in window)) return false

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('🗑️ PWA cache očišćen')
    return true
  } catch (error) {
    console.error('❌ Čišćenje cache-a neuspješno:', error)
    return false
  }
}

/**
 * Provjeri da li je app instaliran kao PWA
 */
export function isPWAInstalled() {
  // Provjeri display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  
  // iOS Safari
  if (window.navigator.standalone === true) {
    return true
  }
  
  return false
}

/**
 * Provjeri da li je uređaj iOS
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * Provjeri da li je Safari na iOS-u
 */
export function isIOSSafari() {
  return isIOS() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
}

/**
 * Provjeri network status
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * Zatraži dozvolu za notifikacije
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('⚠️ Notifikacije nisu podržane')
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Prikaži lokalnu notifikaciju
 */
export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) return false
  
  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') return false
  }

  const defaultOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    ...options
  }

  // Koristi Service Worker notifikacije ako je dostupan
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, defaultOptions)
    return true
  }

  // Fallback na obične notifikacije
  new Notification(title, defaultOptions)
  return true
}
