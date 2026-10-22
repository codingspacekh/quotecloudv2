const WALLPAPER_COUNT = 10

const getWallpaper = (index) => {
  return `assets/images/wallpapers/wallpaper${index % WALLPAPER_COUNT}.jpeg`
}

const getTags = (tags) => {
  let tagContents = ''
  for (let i = 0; i < tags.length; i++) {
    let tagName = tags[i].name
    tagContents += `<a href="quote.html?tag=${encodeURIComponent(tagName)}" class="link tag-link">${escapeHTML(tagName)}</a>`
  }
  return tagContents
}

const getAuthorLink = (author) => {
  if (!author.slug) return escapeHTML(author.name)
  return `<a href="author.html?slug=${encodeURIComponent(author.slug)}" class="link">${escapeHTML(author.name)}</a>`
}

const shownQuotes = {}

const cardSelector = (quoteId) => `.picture-quote[data-id="${CSS.escape(quoteId)}"]`

const findCard = (quoteId) => document.querySelector(cardSelector(quoteId))

const getFavoriteButton = (quoteId) => {
  let favorite = isFavorite(quoteId)
  return `
  <button class="card-action ${favorite ? 'is-favorite' : ''}" data-action="favorite"
    aria-pressed="${favorite}" aria-label="Save to favorites" title="${favorite ? 'Remove from favorites' : 'Save to favorites'}">
    <ion-icon name="${favorite ? 'heart' : 'heart-outline'}"></ion-icon>
  </button>
  `
}

const actionButton = (action, icon, label) => {
  return `
  <button class="card-action" data-action="${action}" aria-label="${label}" title="${label}">
    <ion-icon name="${icon}"></ion-icon>
  </button>
  `
}

const getMainButtons = (quote) => {
  if (quote.mine) {
    return actionButton('edit', 'create-outline', 'Edit quote') + actionButton('delete', 'trash-outline', 'Delete quote')
  }
  return getFavoriteButton(quote.id)
}

const getFavoriteInfo = (quote) => {
  let chips = getCollections()
    .filter(collection => isInCollection(quote, collection.id))
    .map(collection => `<span class="collection-chip"><ion-icon name="folder-outline" aria-hidden="true"></ion-icon>${escapeHTML(collection.name)}</span>`)
    .join('')

  return `
  ${chips ? `<div class="card-collections" aria-label="Collections">${chips}</div>` : ''}
  ${quote.note ? `<p class="quote-note"><span class="visually-hidden">Your note: </span>${escapeHTML(quote.note)}</p>` : ''}
  `
}

const getFavoriteButtons = (quote) => {
  return actionButton('note', 'chatbox-ellipses-outline', quote.note ? 'Edit your note' : 'Add a note')
    + actionButton('collections', 'folder-outline', 'Add to a collection')
}

const createQuoteCard = (quote, imgIndex = Math.floor(Math.random() * WALLPAPER_COUNT), options = {}) => {
  shownQuotes[quote.id] = quote
  let showTools = options.favoriteTools === true

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
      ${showTools ? getFavoriteInfo(quote) : ''}
      <div class="card-actions">
        ${getMainButtons(quote)}
        ${showTools ? getFavoriteButtons(quote) : ''}
        ${actionButton('copy', 'copy-outline', 'Copy quote')}
        ${actionButton('download', 'download-outline', 'Download as image')}
        ${actionButton('facebook', 'logo-facebook', 'Share on Facebook')}
      </div>
    </div>
  </div>
  `
}

const getCardPosition = (wrapper, quoteId) => {
  return [...wrapper.querySelectorAll('.picture-quote')].indexOf(findCard(quoteId))
}

const focusCardAt = (wrapper, position, action) => {
  let cards = wrapper.querySelectorAll('.picture-quote')
  let card = cards[Math.min(position, cards.length - 1)]
  if (!card) return false
  card.querySelector(`[data-action="${action}"]`).focus()
  return true
}

const getFacebookShareURL = (quote) => {
  let page = quote.author.slug ? `author.html?slug=${encodeURIComponent(quote.author.slug)}` : 'index.html'
  let link = new URL(page, window.location.href).href
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
}

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
    }
  }
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
    let saved = getFavorite(quote.id)
    let hasExtras = saved && (saved.note || getQuoteCollections(saved).length > 0)
    let onFavoritesPage = document.querySelector('#favorites') !== null
    if (saved && (hasExtras || onFavoritesPage)) {
      let remove = await askToConfirm({
        title: 'Remove from favorites?',
        text: hasExtras
          ? 'Your note and collections for this quote will be deleted too.'
          : 'You can save it again later from any quote list.',
        quote,
        confirmLabel: 'Remove',
      })
      if (!remove) return
    }
    let favorite = toggleFavorite(quote)
    document.querySelectorAll(`${cardSelector(quote.id)} [data-action="favorite"]`).forEach(button => {
      button.outerHTML = getFavoriteButton(quote.id)
    })
    showToast(favorite ? 'Saved to favorites' : 'Removed from favorites')
    document.dispatchEvent(new CustomEvent('favorites-changed', { detail: { quote, favorite } }))
  }

  if (btn.dataset.action === 'copy') {
    try {
      await copyText(formatQuote(quote))
      showToast('Quote copied!')
    } catch (error) {
      showToast('Could not copy the quote')
    }
  }

  if (btn.dataset.action === 'download') {
    openImageDialog(quote, parseInt(card.dataset.wallpaper))
  }

  if (btn.dataset.action === 'facebook') {
    try {
      await copyText(formatQuote(quote))
      showToast('Quote copied, paste it into your Facebook post')
    } catch (error) {
      showToast('Write the quote in your Facebook post')
    }
    window.open(getFacebookShareURL(quote), '_blank', 'noopener')
  }
})
