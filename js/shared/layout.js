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

const setupThemeToggle = () => {
  const toggle = document.querySelector('.theme-toggle')
  if (!toggle) return

  const showIcon = () => {
    let isDark = document.documentElement.dataset.theme === 'dark'
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

const setupBackToTop = () => {
  const button = document.createElement('button')
  button.className = 'back-to-top'
  button.setAttribute('aria-label', 'Back to top')
  button.title = 'Back to top'
  button.innerHTML = `<ion-icon name="arrow-up-outline"></ion-icon>`
  document.body.appendChild(button)

  const update = () => {
    button.classList.toggle('show', window.scrollY > 600)
  }
  window.addEventListener('scroll', update, { passive: true })
  update()

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
    document.querySelector('header a').focus({ preventScroll: true })
  })
}

const SHORTCUTS = [
  ['/', 'Search'],
  ['R', 'Random quote (home page)'],
  ['← →', 'Previous / next page'],
  ['T', 'Switch theme'],
  ['?', 'Show this list'],
]

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

const clickButton = (selector) => {
  const button = document.querySelector(selector)
  if (!button || button.disabled) return false
  button.click()
  return true
}

const setupShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (document.querySelector('dialog[open]')) return

    let typing = e.target.closest('input, select, textarea, [contenteditable]')
    if (typing) {
      if (e.key === 'Escape' && e.target.type === 'search') e.target.blur()
      return
    }

    let handled = true
    if (e.key === '/') {
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

    if (handled) e.preventDefault()
  })
}

const setupConnectionMessages = () => {
  const banner = document.createElement('div')
  banner.className = 'offline-banner'
  banner.setAttribute('role', 'status')
  banner.innerHTML = `
  <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
  <span>You are offline. Quotes you already saw, your favorites and your own quotes still work.</span>
  `
  document.querySelector('header').after(banner)

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

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return

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
