// Service worker: lets Quote Cloud work offline.
//
// The browser runs this file in the background (it is registered in js/shared/layout.js).
// It sits between the pages and the internet: every request the pages make goes
// through the "fetch" listener below, which can answer with a copy saved in a cache.
//
// It must stay in the main folder: a service worker only controls the pages
// in its own folder and below.
//
// Changed the file list? Change CACHE_VERSION too, so browsers download the new list.

const CACHE_VERSION = 'v1'
const APP_CACHE = `quote-cloud-app-${CACHE_VERSION}`    // our own pages, styles, scripts, pictures
const DATA_CACHE = `quote-cloud-data-${CACHE_VERSION}`  // answers from the quotes API
const CDN_CACHE = `quote-cloud-cdn-${CACHE_VERSION}`    // the font and the icons

const API_HOST = 'api.quotable.kurokeita.dev'
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com']

// keep at most this many API answers (the oldest are removed first)
const MAX_SAVED_ANSWERS = 150

// saved as soon as the service worker is installed, so every page opens offline
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


// ---------- installing and updating ----------

// first visit (or this file changed): save all the app files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_FILES))
      // start working straight away, without waiting for old tabs to close
      .then(() => self.skipWaiting())
  )
})

// delete the caches of older versions
self.addEventListener('activate', (event) => {
  const currentCaches = [APP_CACHE, DATA_CACHE, CDN_CACHE]
  event.waitUntil(
    caches.keys()
      .then(names => {
        let oldNames = names.filter(name => name.startsWith('quote-cloud-') && !currentCaches.includes(name))
        return Promise.all(oldNames.map(name => caches.delete(name)))
      })
      // take control of the pages that are already open
      .then(() => self.clients.claim())
  )
})


// ---------- two ways to answer a request ----------

// removes the oldest answers (a cache keeps them in the order they were saved)
const trimCache = async (cache, maxEntries) => {
  const requests = await cache.keys()
  let extra = requests.length - maxEntries
  for (let i = 0; i < extra; i++) {
    await cache.delete(requests[i])
  }
}

// a copy of the answer with an extra header, so the page can tell it's a saved copy
// (js/shared/api.js reads it and shows the "You are offline" bar)
const markAsSavedCopy = async (response) => {
  const headers = new Headers(response.headers)
  headers.set('X-Saved-Copy', 'true')
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers })
}

// Network first: ask the internet, and save a copy of the answer.
// No internet? Answer with the saved copy.
// Used for our own files (so changes to the code show up straight away)
// and for quotes (so they are always the newest when online).
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
    // ignoreSearch: author.html?slug=albert-einstein can use the saved author.html
    const saved = await cache.match(request, { ignoreSearch: options.ignoreSearch })
    if (!saved) throw error
    return options.markSaved ? markAsSavedCopy(saved) : saved
  }
}

// Cache first: use the saved copy if there is one, otherwise ask the internet.
// Used for the font and icons, which never change.
const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const saved = await cache.match(request)
  if (saved) return saved

  const response = await fetch(request)
  // "opaque" answers come from other websites that don't let us read them
  // (like the font's CSS). We can't check them, but we can still save them.
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone())
  }
  return response
}


// ---------- every request from the pages comes through here ----------

self.addEventListener('fetch', (event) => {
  const request = event.request
  // only reading can be saved (the site never sends data anyway)
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.hostname === API_HOST) {
    event.respondWith(networkFirst(request, DATA_CACHE, { maxEntries: MAX_SAVED_ANSWERS, markSaved: true }))
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, CDN_CACHE))
  } else if (url.origin === self.location.origin) {
    // request.mode 'navigate' means a whole page is being opened
    event.respondWith(networkFirst(request, APP_CACHE, { ignoreSearch: request.mode === 'navigate' }))
  }
  // anything else (e.g. share links) is left to the browser
})
