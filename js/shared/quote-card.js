// The quote card used on every page, and what its buttons do
// (the buttons that only some pages have are handled in that page's file)
// needs: favorites-store.js, ui.js, image-dialog.js
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
// (quotes you wrote yourself have no slug, so there is no author page to link to)
const getAuthorLink = (author) => {
  if (!author.slug) return escapeHTML(author.name)
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

// a small round button on the card, the click is handled by its data-action
const actionButton = (action, icon, label) => {
  return `
  <button class="card-action" data-action="${action}" aria-label="${label}" title="${label}">
    <ion-icon name="${icon}"></ion-icon>
  </button>
  `
}

// first buttons on the card: the heart, or edit + delete for quotes you wrote (my-quotes.js)
const getMainButtons = (quote) => {
  if (quote.mine) {
    return actionButton('edit', 'create-outline', 'Edit quote') + actionButton('delete', 'trash-outline', 'Delete quote')
  }
  return getFavoriteButton(quote.id)
}

// favorites page only: your note and collections (handled in favorites.js)
const getFavoriteTools = (quote) => {
  let names = getCollections()
    .filter(collection => isInCollection(quote, collection.id))
    .map(collection => `<span class="collection-chip"><ion-icon name="folder-outline" aria-hidden="true"></ion-icon>${escapeHTML(collection.name)}</span>`)
    .join('')

  return {
    info: `
      ${names ? `<div class="card-collections" aria-label="Collections">${names}</div>` : ''}
      ${quote.note ? `<p class="quote-note"><span class="visually-hidden">Your note: </span>${escapeHTML(quote.note)}</p>` : ''}
    `,
    buttons: actionButton('note', 'chatbox-ellipses-outline', quote.note ? 'Edit your note' : 'Add a note')
      + actionButton('collections', 'folder-outline', 'Add to a collection'),
  }
}

// the quote text is shown once, on top of the picture
// options.favoriteTools: show your note and collection buttons (favorites page)
const createQuoteCard = (quote, imgIndex = Math.floor(Math.random() * WALLPAPER_COUNT), options = {}) => {
  shownQuotes[quote.id] = quote
  let tools = options.favoriteTools ? getFavoriteTools(quote) : { info: '', buttons: '' }

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
      ${tools.info}
      <div class="card-actions">
        ${getMainButtons(quote)}
        ${tools.buttons}
        ${actionButton('copy', 'copy-outline', 'Copy quote')}
        ${actionButton('download', 'download-outline', 'Download as image')}
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
    // ask first when removing a favorite loses something: your note and collections,
    // or the card itself on the favorites page (it disappears from the list)
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
    // opens the window to pick the size and background (image-dialog.js)
    openImageDialog(quote, parseInt(card.dataset.wallpaper))
  }
})
