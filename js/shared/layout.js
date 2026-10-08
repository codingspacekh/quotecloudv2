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
    try {
      localStorage.setItem('theme', newTheme)
    } catch (error) {
      // can't remember it, but the switch still works on this page
    }
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

setupSearchForms()
setupThemeToggle()
setFooterYear()
