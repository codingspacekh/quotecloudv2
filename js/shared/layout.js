// Things in the header and footer of every page.
// Load this after the other shared files: it runs straight away.

// every quote search form on the site sends you to the quotes page
// (the author search on author.html is handled by js/pages/authors.js)
const setupSearchForms = () => {
  const searchForms = document.querySelectorAll('.search-form:not(.author-search)')
  searchForms.forEach(form => {
    const input = form.querySelector('input[type="search"]')

    form.addEventListener('submit', (e) => {
      e.preventDefault()

      let searchTerm = input.value.trim()
      if (!searchTerm) return

      window.location.href = `quote.html?query=${encodeURIComponent(searchTerm)}`
    })
  })
}

// theme.js already picked the theme, this button switches it
const setupThemeToggle = () => {
  const toggle = document.querySelector('.theme-toggle')
  if (!toggle) return

  const showIcon = () => {
    let isDark = document.documentElement.dataset.theme === 'dark'
    // show the theme you will switch to
    toggle.innerHTML = `<ion-icon name="${isDark ? 'sunny-outline' : 'moon-outline'}"></ion-icon>`
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme')
    toggle.title = toggle.getAttribute('aria-label')
  }

  toggle.addEventListener('click', () => {
    let newTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = newTheme
    saveSetting('theme', newTheme)
    showIcon()
  })

  showIcon()
}

const setFooterYear = () => {
  const year = document.querySelector('footer .year')
  if (year) {
    year.textContent = new Date().getFullYear()
  }
}

// ---------- "back to top" button ----------

const setupBackToTop = () => {
  const button = document.createElement('button')
  button.className = 'back-to-top'
  button.setAttribute('aria-label', 'Back to top')
  button.title = 'Back to top'
  button.innerHTML = `<ion-icon name="arrow-up-outline"></ion-icon>`
  document.body.appendChild(button)

  // only show it after scrolling down a bit
  const update = () => {
    button.classList.toggle('show', window.scrollY > 600)
  }
  // passive: we never stop the scrolling, so the browser can scroll smoothly
  window.addEventListener('scroll', update, { passive: true })
  update()

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
    // move the keyboard to the top too, so Tab starts from the menu again
    document.querySelector('header a').focus({ preventScroll: true })
  })
}

// ---------- keyboard shortcuts ----------

const SHORTCUTS = [
  ['/', 'Search'],
  ['R', 'Random quote (home page)'],
  ['← →', 'Previous / next page'],
  ['T', 'Switch theme'],
  ['?', 'Show this list'],
]

// opens a small window that lists the shortcuts
const showShortcuts = () => {
  let dialog = document.querySelector('.shortcuts-dialog')
  if (!dialog) {
    dialog = document.createElement('dialog')
    dialog.className = 'dialog shortcuts-dialog'
    dialog.setAttribute('aria-labelledby', 'shortcutsTitle')
    dialog.innerHTML = `
    <h3 id="shortcutsTitle">Keyboard shortcuts</h3>
    <dl>
      ${SHORTCUTS.map(([keys, action]) => `<dt><kbd>${keys}</kbd></dt><dd>${action}</dd>`).join('')}
    </dl>
    <form method="dialog"><button class="btn">Close</button></form>
    `
    closeOnBackdropClick(dialog)
    document.body.appendChild(dialog)
  }
  if (!dialog.open) dialog.showModal()
}

// clicks a button if it is on this page and can be clicked
const clickButton = (selector) => {
  const button = document.querySelector(selector)
  if (!button || button.disabled) return false
  button.click()
  return true
}

const setupShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // leave Ctrl+R, Cmd+F, ... to the browser
    if (e.ctrlKey || e.metaKey || e.altKey) return
    // a window like the shortcuts list is open
    if (document.querySelector('dialog[open]')) return

    // while typing, letters are just letters
    let typing = e.target.closest('input, select, textarea, [contenteditable]')
    if (typing) {
      // Escape leaves the search box
      if (e.key === 'Escape' && e.target.type === 'search') e.target.blur()
      return
    }

    let handled = true
    if (e.key === '/') {
      // the first search box on the page
      const input = document.querySelector('.search-form input')
      if (input) input.focus()
    } else if (e.key === 'r' || e.key === 'R') {
      handled = clickButton('#randomQuoteBtn')
    } else if (e.key === 'ArrowLeft') {
      handled = clickButton('.btn-group .prevBtn')
    } else if (e.key === 'ArrowRight') {
      handled = clickButton('.btn-group .nextBtn')
    } else if (e.key === 't' || e.key === 'T') {
      handled = clickButton('.theme-toggle')
    } else if (e.key === '?') {
      showShortcuts()
    } else {
      handled = false
    }

    // stop the browser doing its own thing too (e.g. "/" opens Quick Find in Firefox)
    if (handled) e.preventDefault()
  })
}

// ---------- offline / online ----------

// a bar under the header while there is no internet
const setupConnectionMessages = () => {
  const banner = document.createElement('div')
  banner.className = 'offline-banner'
  banner.setAttribute('role', 'status')
  banner.innerHTML = `
  <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
  <span>You are offline. Quotes you already saw, your favorites and your own quotes still work.</span>
  `
  document.querySelector('header').after(banner)

  // false when the browser says it's offline, or the quotes service can't be reached (api.js)
  let online = navigator.onLine

  const update = (nowOnline) => {
    if (nowOnline === online) return
    online = nowOnline
    banner.classList.toggle('show', !online)
    if (online) showToast('Back online')
  }
  banner.classList.toggle('show', !online)

  window.addEventListener('offline', () => update(false))
  window.addEventListener('online', () => update(true))
  document.addEventListener('connection-change', (e) => update(e.detail.online))
}

// sw.js keeps copies of the site and the quotes you saw, so they open without internet
const registerServiceWorker = () => {
  // service workers only work on http(s) pages, e.g. a local server (see README),
  // not on a page opened by double-clicking the file
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return

  // wait until the page has loaded, so saving the files doesn't slow it down
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(error => {
      console.error('Offline mode is not available:', error)
    })
  })
}

setupSearchForms()
setupThemeToggle()
setFooterYear()
setupBackToTop()
setupShortcuts()
setupConnectionMessages()
registerServiceWorker()
