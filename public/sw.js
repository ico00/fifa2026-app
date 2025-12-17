/**
 * FIFA 2026 Service Worker
 * 
 * Strategije cachiranja:
 * - API pozivi: Network-first (uvijek svježi podaci kad je online)
 * - Statički resursi: Cache-first (brže učitavanje)
 * - Navigacija: Network-first s offline fallbackom
 */

const CACHE_NAME = 'fifa2026-v1'
const API_CACHE_NAME = 'fifa2026-api-v1'

// Statički resursi za precaching
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/images/header-bg.jpg',
  '/images/modric-hero.jpg',
  '/images/modric-hero-mobile.jpg'
]

// API rute koje treba cachirati (network-first)
const API_ROUTES = [
  '/api/teams',
  '/api/groups',
  '/api/matches',
  '/api/standings',
  '/api/playoffs',
  '/api/venues'
]

/**
 * Install event - precache statičke resurse
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Precaching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Service Worker: Installed successfully')
        // Aktiviraj odmah bez čekanja
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker: Install failed', error)
      })
  )
})

/**
 * Activate event - očisti stare cache-ove
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map((name) => {
              console.log('🗑️ Service Worker: Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activated successfully')
        // Preuzmi kontrolu nad svim klijentima odmah
        return self.clients.claim()
      })
  )
})

/**
 * Fetch event - interceptaj sve mrežne zahtjeve
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignoriraj non-GET zahtjeve
  if (request.method !== 'GET') {
    return
  }

  // Ignoriraj chrome-extension i druge non-http zahtjeve
  if (!url.protocol.startsWith('http')) {
    return
  }

  // API zahtjevi - Network-first strategija
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Navigacija - Network-first s offline fallbackom
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Statički resursi - Cache-first strategija
  event.respondWith(cacheFirstStrategy(request))
})

/**
 * Network-first strategija za API pozive
 * Uvijek pokušava dohvatiti svježe podatke
 */
async function networkFirstStrategy(request) {
  try {
    // Pokušaj dohvatiti s mreže
    const networkResponse = await fetch(request)
    
    // Ako je uspješno, spremi u cache za offline
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('📴 Service Worker: Network failed, trying cache for:', request.url)
    
    // Ako mreža ne radi, pokušaj iz cache-a
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Vrati error response ako nema ni u cache-u
    return new Response(
      JSON.stringify({ error: 'Offline - podaci nisu dostupni' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Cache-first strategija za statičke resurse
 */
async function cacheFirstStrategy(request) {
  // Prvo provjeri cache
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Osvježi cache u pozadini (stale-while-revalidate)
    fetchAndCache(request)
    return cachedResponse
  }
  
  // Ako nije u cache-u, dohvati s mreže
  try {
    const networkResponse = await fetch(request)
    
    // Spremi u cache za sljedeći put
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('📴 Service Worker: Resource not available:', request.url)
    
    // Za slike, vrati placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1e293b" width="100" height="100"/><text fill="#64748b" x="50%" y="50%" text-anchor="middle" dy=".3em">⚽</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      )
    }
    
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Navigacija strategija - Network-first s offline fallbackom
 */
async function navigationStrategy(request) {
  try {
    // Pokušaj dohvatiti s mreže
    const networkResponse = await fetch(request)
    
    // Spremi uspješan odgovor u cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('📴 Service Worker: Navigation failed, serving cached page')
    
    // Vrati cached verziju
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback na cached index.html
    return caches.match('/index.html')
  }
}

/**
 * Helper: Dohvati i spremi u cache (za background refresh)
 */
async function fetchAndCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response)
    }
  } catch (error) {
    // Tiho ignoriraj - background refresh
  }
}

/**
 * Message event - komunikacija s aplikacijom
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name))
    })
  }
})

/**
 * Push event - za buduće push notifikacije
 */
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  const options = {
    body: data.body || 'Nova obavijest',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Otvori' },
      { action: 'close', title: 'Zatvori' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'FIFA 2026', options)
  )
})

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'close') return
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Ako je app već otvoren, fokusiraj ga
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Inače otvori novi prozor
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

console.log('⚽ FIFA 2026 Service Worker loaded')
