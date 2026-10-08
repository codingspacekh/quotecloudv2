// Favorite quotes, saved in this browser with localStorage

const FAVORITES_KEY = 'favoriteQuotes'

const getFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
  } catch (error) {
    return []
  }
}

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch (error) {
    showToast('Could not save favorites in this browser')
  }
}

const isFavorite = (quoteId) => {
  return getFavorites().some(quote => quote.id === quoteId)
}

// adds or removes the quote, returns true when it is now a favorite
const toggleFavorite = (quote) => {
  let favorites = getFavorites()
  if (favorites.some(fav => fav.id === quote.id)) {
    saveFavorites(favorites.filter(fav => fav.id !== quote.id))
    return false
  }
  // newest favorites first, only keep what a card needs
  favorites.unshift({
    id: quote.id,
    content: quote.content,
    author: { name: quote.author.name, slug: quote.author.slug },
    tags: quote.tags.map(tag => ({ name: tag.name })),
  })
  saveFavorites(favorites)
  return true
}
