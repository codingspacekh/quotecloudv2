// Favorite quotes, with your notes and collections, saved in this browser with localStorage

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

const getFavorite = (quoteId) => {
  return getFavorites().find(quote => quote.id === quoteId)
}

// changes some fields of one favorite, e.g. updateFavorite(id, { note: 'Nice!' })
// returns the changed favorite
const updateFavorite = (quoteId, changes) => {
  let updated = null
  let favorites = getFavorites().map(quote => {
    if (quote.id !== quoteId) return quote
    updated = { ...quote, ...changes }
    return updated
  })
  saveFavorites(favorites)
  return updated
}


// ---------- collections ----------

// A collection is a named group of favorites, like { id: 'c-1696800000000', name: 'Motivation' }.
// Each favorite keeps the ids of its collections: favorite.collections = ['c-1696800000000', ...]
// so removing a favorite also takes it out of its collections.

const COLLECTIONS_KEY = 'quoteCollections'
const COLLECTION_NAME_MAX = 30

const getCollections = () => {
  try {
    return JSON.parse(localStorage.getItem(COLLECTIONS_KEY)) || []
  } catch (error) {
    return []
  }
}

const saveCollections = (collections) => {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
  } catch (error) {
    showToast('Could not save collections in this browser')
  }
}

// the collections a favorite is in (old favorites have none yet)
const getQuoteCollections = (quote) => quote.collections || []

const isInCollection = (quote, collectionId) => getQuoteCollections(quote).includes(collectionId)

// returns an error message, or '' when the name is fine.
// ignoreId: the collection being renamed (it may keep its own name)
const checkCollectionName = (name, ignoreId = null) => {
  if (!name) return 'Give the collection a name.'
  if (name.length > COLLECTION_NAME_MAX) return `Use at most ${COLLECTION_NAME_MAX} letters.`
  let taken = getCollections().some(collection => {
    return collection.id !== ignoreId && collection.name.toLowerCase() === name.toLowerCase()
  })
  if (taken) return 'You already have a collection with this name.'
  return ''
}

// returns the new collection (check the name with checkCollectionName first)
const createCollection = (name) => {
  const collection = { id: `c-${Date.now()}`, name }
  saveCollections([...getCollections(), collection])
  return collection
}

const renameCollection = (collectionId, name) => {
  saveCollections(getCollections().map(collection => {
    return collection.id === collectionId ? { ...collection, name } : collection
  }))
}

// deletes the collection, the quotes stay in favorites
const deleteCollection = (collectionId) => {
  saveCollections(getCollections().filter(collection => collection.id !== collectionId))
  saveFavorites(getFavorites().map(quote => ({
    ...quote,
    collections: getQuoteCollections(quote).filter(id => id !== collectionId),
  })))
}

// puts the quote in the collection, or takes it out
const setInCollection = (quoteId, collectionId, inCollection) => {
  let quote = getFavorite(quoteId)
  let others = getQuoteCollections(quote).filter(id => id !== collectionId)
  return updateFavorite(quoteId, { collections: inCollection ? [...others, collectionId] : others })
}
