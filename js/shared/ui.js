// Small pieces of page content: loading spinner, messages and pop-ups

const loadingView = `
<div class="loading">
  <div class="circle"></div>
</div>
`

// message can contain HTML (e.g. a link), so only pass text you wrote yourself
const messageView = (message) => `<p class="message">${message}</p>`


// ---------- safe HTML ----------

// Text from the API (or from localStorage) must go through escapeHTML before
// it is put inside innerHTML. Otherwise a quote like  <img src=x onerror="...">
// would become a real element and could run code on our page.
const escapeHTML = (text) => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// only allow normal web links in href, never "javascript:..."
const safeURL = (url) => {
  try {
    let parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '#'
  } catch (error) {
    return '#'
  }
}


// ---------- errors with a "Try again" button ----------

// shows the error inside container, onRetry is the function that loads it again
const showError = (container, message, onRetry) => {
  let offline = !navigator.onLine
  container.innerHTML = `
  <div class="message error-message" role="alert">
    <p>${offline ? 'You are offline. Check your internet connection.' : message}</p>
    <button class="btn retry-btn">Try again</button>
  </div>
  `

  const retry = () => {
    window.removeEventListener('online', retry)
    onRetry()
  }
  container.querySelector('.retry-btn').addEventListener('click', retry)
  // load it again by itself when the internet comes back
  window.addEventListener('online', retry)
}

// ---------- small pop-up message ----------

let toastTimer = null

const showToast = (message) => {
  let toast = document.querySelector('.toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.className = 'toast'
    toast.setAttribute('role', 'status')
    document.body.appendChild(toast)
  }
  toast.textContent = message
  toast.classList.add('show')

  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000)
}
