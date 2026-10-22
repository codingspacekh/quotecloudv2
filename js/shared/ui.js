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

const messageView = (message) => `<p class="message">${message}</p>`

const formatQuote = (quote) => `“${quote.content}” — ${quote.author.name}`

const scrollBehavior = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

const escapeHTML = (text) => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const safeURL = (url) => {
  try {
    let parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '#'
  } catch (error) {
    return '#'
  }
}

const getErrorReason = (error) => {
  if (!navigator.onLine) return 'You are offline. Check your internet connection.'
  if (!error) return ''
  if (error.reason === 'timeout') return 'The quotes service is taking too long to answer.'
  if (error.reason === 'network') return 'Could not reach the quotes service. Check your internet connection.'
  if (error.status === 429) return 'Too many requests. Wait a few seconds, then try again.'
  if (error.status >= 500) return 'The quotes service is having problems right now.'
  return ''
}

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

  const errorBox = container.querySelector('.error-message')
  const retry = () => {
    window.removeEventListener('online', retry)
    if (!errorBox.isConnected) return
    onRetry()
  }
  container.querySelector('.retry-btn').addEventListener('click', retry)
  window.addEventListener('online', retry)
}

const setFieldError = (field, errorElement, message) => {
  errorElement.textContent = message
  field.setAttribute('aria-invalid', message ? 'true' : 'false')
}

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

const closeOnBackdropClick = (dialog) => {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close()
  })
}

let confirmDialog = null

const createConfirmDialog = () => {
  const dialog = document.createElement('dialog')
  dialog.className = 'dialog form-dialog confirm-dialog'
  dialog.setAttribute('aria-labelledby', 'confirmDialogTitle')
  dialog.setAttribute('aria-describedby', 'confirmDialogText')
  dialog.innerHTML = `
  <h3 id="confirmDialogTitle"></h3>
  <blockquote class="dialog-quote"></blockquote>
  <p class="dialog-hint" id="confirmDialogText"></p>
  <div class="dialog-buttons">
    <button type="button" class="btn cancel-btn">Cancel</button>
    <button type="button" class="btn danger-btn confirm-btn">
      <ion-icon name="trash-outline" aria-hidden="true"></ion-icon> <span class="confirm-label"></span>
    </button>
  </div>
  `

  dialog.querySelector('.cancel-btn').addEventListener('click', () => dialog.close('cancel'))
  dialog.querySelector('.confirm-btn').addEventListener('click', () => dialog.close('confirm'))
  closeOnBackdropClick(dialog)

  document.body.appendChild(dialog)
  return dialog
}

const askToConfirm = ({ title, text, quote = null, confirmLabel = 'Delete' }) => {
  if (!confirmDialog) {
    confirmDialog = createConfirmDialog()
  }

  confirmDialog.querySelector('#confirmDialogTitle').textContent = title
  confirmDialog.querySelector('#confirmDialogText').textContent = text
  confirmDialog.querySelector('.confirm-label').textContent = confirmLabel

  const quoteBox = confirmDialog.querySelector('.dialog-quote')
  quoteBox.textContent = quote ? formatQuote(quote) : ''
  quoteBox.classList.toggle('hide', !quote)

  confirmDialog.returnValue = ''
  confirmDialog.showModal()
  confirmDialog.querySelector('.cancel-btn').focus()

  return new Promise(resolve => {
    confirmDialog.addEventListener('close', () => {
      resolve(confirmDialog.returnValue === 'confirm')
    }, { once: true })
  })
}
