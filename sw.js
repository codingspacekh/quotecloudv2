const CACHE_VERSION = 'v1'
const APP_CACHE = `quote-cloud-app-${CACHE_VERSION}`
const DATA_CACHE = `quote-cloud-data-${CACHE_VERSION}`
const CDN_CACHE = `quote-cloud-cdn-${CACHE_VERSION}`

const API_HOST = 'api.quotable.kurokeita.dev'
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com']

const MAX_SAVED_ANSWERS = 150

const APP_FILES = [
  './',
  'index.html',
  'quote.html',
  'tag.html',
  'author.html',
  'favorites.html',
  'my-quotes.html',

  'css/main.css',
  'css/variables.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/pages/tags.css',
  'css/pages/authors.css',
  'css/pages/favorites.css',
  'css/pages/my-quotes.css',
  'css/responsive.css',

  'js/theme.js',
  'js/shared/settings.js',
  'js/shared/api.js',
  'js/shared/ui.js',
  'js/shared/favorites-store.js',
  'js/shared/quote-image.js',
  'js/shared/image-dialog.js',
  'js/shared/quote-card.js',
  'js/shared/pagination.js',
  'js/shared/layout.js',
  'js/pages/home.js',
  'js/pages/quotes.js',
  'js/pages/tags.js',
  'js/pages/authors.js',
  'js/pages/favorites.js',
  'js/pages/my-quotes.js',

  'assets/images/logo.png',
  'assets/images/favicon.svg',
  'assets/images/banner.webp',
  'assets/images/wallpapers/wallpaper0.jpeg',
  'assets/images/wallpapers/wallpaper1.jpeg',
  'assets/images/wallpapers/wallpaper2.jpeg',
  'assets/images/wallpapers/wallpaper3.jpeg',
  'assets/images/wallpapers/wallpaper4.jpeg',
  'assets/images/wallpapers/wallpaper5.jpeg',
  'assets/images/wallpapers/wallpaper6.jpeg',
  'assets/images/wallpapers/wallpaper7.jpeg',
  'assets/images/wallpapers/wallpaper8.jpeg',
  'assets/images/wallpapers/wallpaper9.jpeg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const currentCaches = [APP_CACHE, DATA_CACHE, CDN_CACHE]
  event.waitUntil(
    caches.keys()
      .then(names => {
        let oldNames = names.filter(name => name.startsWith('quote-cloud-') && !currentCaches.includes(name))
        return Promise.all(oldNames.map(name => caches.delete(name)))
      })
      .then(() => self.clients.claim())
  )
})

const trimCache = async (cache, maxEntries) => {
  const requests = await cache.keys()
  let extra = requests.length - maxEntries
  for (let i = 0; i < extra; i++) {
    await cache.delete(requests[i])
  }
}

const markAsSavedCopy = async (response) => {
  const headers = new Headers(response.headers)
  headers.set('X-Saved-Copy', 'true')
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers })
}

const networkFirst = async (request, cacheName, options = {}) => {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
      if (options.maxEntries) await trimCache(cache, options.maxEntries)
    }
    return response
  } catch (error) {
    const saved = await cache.match(request, { ignoreSearch: options.ignoreSearch })
    if (!saved) throw error
    return options.markSaved ? markAsSavedCopy(saved) : saved
  }
}

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const saved = await cache.match(request)
  if (saved) return saved

  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.hostname === API_HOST) {
    event.respondWith(networkFirst(request, DATA_CACHE, { maxEntries: MAX_SAVED_ANSWERS, markSaved: true }))
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, CDN_CACHE))
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, APP_CACHE, { ignoreSearch: request.mode === 'navigate' }))
  }
})
