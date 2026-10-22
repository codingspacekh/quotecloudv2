let savedTheme = null
try {
  savedTheme = localStorage.getItem('theme')
} catch (error) {
}

const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
document.documentElement.dataset.theme = savedTheme || (prefersLight ? 'light' : 'dark')
