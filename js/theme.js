// Loaded in <head> so the right colors are used before the page is drawn
// (otherwise the page would flash dark, then turn light).
// Uses the theme saved by the toggle button, or the computer's own setting.
let savedTheme = null
try {
  savedTheme = localStorage.getItem('theme')
} catch (error) {
  // localStorage can be blocked (e.g. private windows), then we just don't remember
}

const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
document.documentElement.dataset.theme = savedTheme || (prefersLight ? 'light' : 'dark')
