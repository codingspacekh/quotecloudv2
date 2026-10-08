// Small pieces of page content: loading placeholders, messages and pop-ups

// ---------- loading placeholders ("skeletons") ----------

// Grey shapes the size of the real content, shown while it loads,
// so the page doesn't jump around when the content arrives.
// Screen readers skip the shapes (aria-hidden) and hear "Loading..." instead.

const repeat = (count, html) => Array.from({ length: count }, () => html).join('')

const loadingText = `<span class="visually-hidden" role="status">Loading...</span>`

const quoteSkeletons = (count) => loadingText + repeat(count, `
<div class="picture-quote skeleton" aria-hidden="true">
  <div class="skeleton-frame"></div>
  <div class="content">
    <span class="skeleton-line short"></span>
    <span class="skeleton-line"></span>
  </div>
</div>
`)

const authorSkeletons = (count) => loadingText + repeat(count, `
<div class="author-card skeleton" aria-hidden="true">
  <span class="skeleton-line short"></span>
  <span class="skeleton-line"></span>
  <span class="skeleton-line tiny"></span>
</div>
`)

const tagSkeletons = (count) => loadingText + repeat(count, `
<span class="tag-card skeleton skeleton-tag" aria-hidden="true"></span>
`)

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

// explains the error from fetchJSON (see api.js) in plain words
const getErrorReason = (error) => {
  if (!navigator.onLine) return 'You are offline. Check your internet connection.'
  if (!error) return ''
  if (error.reason === 'timeout') return 'The quotes service is taking too long to answer.'
  if (error.reason === 'network') return 'Could not reach the quotes service. Check your internet connection.'
  if (error.status === 429) return 'Too many requests. Wait a few seconds, then try again.'
  if (error.status >= 500) return 'The quotes service is having problems right now.'
  return ''
}

// shows the error inside container, onRetry is the function that loads it again
const showError = (container, message, onRetry, error) => {
  let reason = getErrorReason(error)
  container.innerHTML = `
  <div class="message error-message" role="alert">
    <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
    <p><strong>${message}</strong></p>
    ${reason ? `<p>${reason}</p>` : ''}
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
