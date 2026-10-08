// The quote card used on every page, and what its buttons do
// needs: favorites-store.js, ui.js, quote-image.js
// All text from the API goes through escapeHTML (see ui.js) before it is used in HTML.

// there are 10 wallpapers in assets/images/wallpapers (wallpaper0.jpeg ... wallpaper9.jpeg)
const WALLPAPER_COUNT = 10

const getWallpaper = (index) => {
  return `assets/images/wallpapers/wallpaper${index % WALLPAPER_COUNT}.jpeg`
}

// tags are objects like { id, name }
const getTags = (tags) => {
  let tagContents = ''
  for (let i = 0; i < tags.length; i++) {
    let tagName = tags[i].name
    tagContents += `<a href="quote.html?tag=${encodeURIComponent(tagName)}" class="link tag-link">${escapeHTML(tagName)}</a>`
  }
  return tagContents
}

// author is an object like { id, name, slug, description, bio, link }
const getAuthorLink = (author) => {
  return `<a href="author.html?slug=${encodeURIComponent(author.slug)}" class="link">${escapeHTML(author.name)}</a>`
}

// ---------- quote cards ----------

// every quote shown on the page, so the card buttons can find it by id
const shownQuotes = {}

const getFavoriteButton = (quoteId) => {
  let favorite = isFavorite(quoteId)
  return `
  <button class="card-action ${favorite ? 'is-favorite' : ''}" data-action="favorite"
    aria-pressed="${favorite}" aria-label="Save to favorites" title="${favorite ? 'Remove from favorites' : 'Save to favorites'}">
    <ion-icon name="${favorite ? 'heart' : 'heart-outline'}"></ion-icon>
  </button>
  `
}

const getShareText = (quote) => `"${quote.content}" — ${quote.author.name}`

// the quote text is shown once, on top of the picture
const createQuoteCard = (quote, imgIndex = Math.floor(Math.random() * WALLPAPER_COUNT)) => {
  shownQuotes[quote.id] = quote
  let shareText = encodeURIComponent(getShareText(quote))

  return `
  <div class="picture-quote" data-id="${escapeHTML(quote.id)}" data-wallpaper="${imgIndex % WALLPAPER_COUNT}">
    <div class="frame" style="background-image: url('${getWallpaper(imgIndex)}');">
      <div class="overlay">
        <blockquote>${escapeHTML(quote.content)}</blockquote>
      </div>
    </div>
    <div class="content">
      <cite>${getAuthorLink(quote.author)}</cite>
      <div class="tags">
        ${getTags(quote.tags)}
      </div>
      <div class="card-actions">
        ${getFavoriteButton(quote.id)}
        <button class="card-action" data-action="copy" aria-label="Copy quote" title="Copy quote">
          <ion-icon name="copy-outline"></ion-icon>
        </button>
        <button class="card-action" data-action="download" aria-label="Download as image" title="Download as image">
          <ion-icon name="download-outline"></ion-icon>
        </button>
        <a class="card-action" href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener" aria-label="Share on WhatsApp" title="Share on WhatsApp">
          <ion-icon name="logo-whatsapp"></ion-icon>
        </a>
        <a class="card-action" href="https://x.com/intent/tweet?text=${shareText}" target="_blank" rel="noopener" aria-label="Share on X" title="Share on X">
          <ion-icon name="logo-x"></ion-icon>
        </a>
      </div>
    </div>
  </div>
  `
}

// ---------- card buttons: favorite, copy, download ----------

const copyText = async (text) => {
  // navigator.clipboard only works on https or localhost,
  // and the browser can still say no
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      // try the older way below
    }
  }
  // older way, works almost everywhere
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) {
    throw new Error('Copy is not allowed')
  }
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]')
  if (!btn) return

  const card = btn.closest('.picture-quote')
  if (!card) return
  const quote = shownQuotes[card.dataset.id]

  if (btn.dataset.action === 'favorite') {
    let favorite = toggleFavorite(quote)
    // the same quote can be on the page twice (e.g. quote of the day + famous quotes)
    document.querySelectorAll(`.picture-quote[data-id="${CSS.escape(quote.id)}"] [data-action="favorite"]`).forEach(button => {
      button.outerHTML = getFavoriteButton(quote.id)
    })
    showToast(favorite ? 'Saved to favorites' : 'Removed from favorites')
    // lets favorites.html remove the card straight away
    document.dispatchEvent(new CustomEvent('favorites-changed', { detail: { quote, favorite } }))
  }

  if (btn.dataset.action === 'copy') {
    try {
      await copyText(getShareText(quote))
      showToast('Quote copied!')
    } catch (error) {
      showToast('Could not copy the quote')
    }
  }

  if (btn.dataset.action === 'download') {
    btn.disabled = true
    try {
      await downloadQuoteImage(quote, parseInt(card.dataset.wallpaper))
      showToast('Image downloaded')
    } catch (error) {
      console.log('some error occurred:', error.message)
      showToast('Could not create the image')
    }
    btn.disabled = false
  }
})
