const FAVORITES_KEY = 'favoriteQuotes'

const getFavorites = () => loadJSON(FAVORITES_KEY, [])

const saveFavorites = (favorites) => {
  if (!saveJSON(FAVORITES_KEY, favorites)) {
    showToast('Could not save favorites in this browser')
  }
}

const isFavorite = (quoteId) => {
  return getFavorites().some(quote => quote.id === quoteId)
}

const toggleFavorite = (quote) => {
  let favorites = getFavorites()
  if (favorites.some(fav => fav.id === quote.id)) {
    saveFavorites(favorites.filter(fav => fav.id !== quote.id))
    return false
  }
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

const COLLECTIONS_KEY = 'quoteCollections'
const COLLECTION_NAME_MAX = 30

const getCollections = () => loadJSON(COLLECTIONS_KEY, [])

const saveCollections = (collections) => {
  if (!saveJSON(COLLECTIONS_KEY, collections)) {
    showToast('Could not save collections in this browser')
  }
}

const getQuoteCollections = (quote) => quote.collections || []

const isInCollection = (quote, collectionId) => getQuoteCollections(quote).includes(collectionId)

const checkCollectionName = (name, ignoreId = null) => {
  if (!name) return 'Give the collection a name.'
  if (name.length > COLLECTION_NAME_MAX) return `Use at most ${COLLECTION_NAME_MAX} letters.`
  let taken = getCollections().some(collection => {
    return collection.id !== ignoreId && collection.name.toLowerCase() === name.toLowerCase()
  })
  if (taken) return 'You already have a collection with this name.'
  return ''
}

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

const deleteCollection = (collectionId) => {
  saveCollections(getCollections().filter(collection => collection.id !== collectionId))
  saveFavorites(getFavorites().map(quote => ({
    ...quote,
    collections: getQuoteCollections(quote).filter(id => id !== collectionId),
  })))
}

const setInCollection = (quoteId, collectionId, inCollection) => {
  let quote = getFavorite(quoteId)
  let others = getQuoteCollections(quote).filter(id => id !== collectionId)
  return updateFavorite(quoteId, { collections: inCollection ? [...others, collectionId] : others })
}
