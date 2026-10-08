const title = document.querySelector('#favorites .title')
const quotesWrapper = document.querySelector('.quotes-wrapper')

const emptyMessage = messageView(
  'You have no favorite quotes yet. Tap the <ion-icon name="heart-outline"></ion-icon> on any quote to save it here. ' +
  '<a href="quote.html" class="link">Browse quotes</a>'
)

const updateTitle = () => {
  let count = getFavorites().length
  title.textContent = count ? `MY FAVORITES (${count})` : `MY FAVORITES`
}

const displayFavorites = () => {
  // favorites are saved in this browser, so no API call is needed
  let favorites = getFavorites()
  updateTitle()

  if (favorites.length === 0) {
    quotesWrapper.innerHTML = emptyMessage
    return
  }

  quotesWrapper.innerHTML = favorites.map((quote, i) => createQuoteCard(quote, i)).join('')
}

// when a heart is clicked on this page, take the card away
document.addEventListener('favorites-changed', (e) => {
  if (e.detail.favorite) return

  const card = quotesWrapper.querySelector(`.picture-quote[data-id="${CSS.escape(e.detail.quote.id)}"]`)
  if (card) card.remove()

  updateTitle()
  if (getFavorites().length === 0) {
    quotesWrapper.innerHTML = emptyMessage
  }
})

displayFavorites()
