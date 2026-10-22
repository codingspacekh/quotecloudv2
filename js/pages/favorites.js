const title = document.querySelector('#favorites .title')
const collectionBar = document.querySelector('.collection-bar')
const collectionActions = document.querySelector('.collection-actions')
const quotesWrapper = document.querySelector('.quotes-wrapper')

const noteDialog = document.querySelector('#noteDialog')
const noteText = document.querySelector('#noteText')
const noteCount = document.querySelector('#noteCount')

const collectionsDialog = document.querySelector('#collectionsDialog')
const collectionCheckboxes = document.querySelector('.collection-checkboxes')
const newCollectionForm = document.querySelector('.new-collection-form')
const newCollectionName = document.querySelector('#newCollectionName')
const newCollectionError = document.querySelector('#newCollectionError')

const collectionNameDialog = document.querySelector('#collectionNameDialog')
const collectionNameTitle = document.querySelector('#collectionNameTitle')
const collectionName = document.querySelector('#collectionName')
const collectionNameError = document.querySelector('#collectionNameError')

const NOTE_MAX = 200
const ALL = 'all'

const params = new URLSearchParams(window.location.search)
let currentCollection = params.get('collection') || ALL
let dialogQuoteId = null
let renamingId = null

const emptyMessage = messageView(
  'You have no favorite quotes yet. Tap the <ion-icon name="heart-outline"></ion-icon> on any quote to save it here. ' +
  '<a href="quote.html" class="link">Browse quotes</a>'
)

const emptyCollectionMessage = messageView(
  'This collection is empty. Tap the <ion-icon name="folder-outline"></ion-icon> on a quote to add it here.'
)

const updateTitle = () => {
  let count = getFavorites().length
  title.textContent = count ? `MY FAVORITES (${count})` : `MY FAVORITES`
}

const setCurrentCollection = (collectionId) => {
  currentCollection = collectionId
  setURLParam('collection', collectionId === ALL ? null : collectionId)
}

const focusCurrentCollection = () => {
  const btn = collectionBar.querySelector('.btn-active')
  if (btn) btn.focus()
}

const collectionButton = (id, name, count) => {
  let active = id === currentCollection
  return `
  <button class="collection-btn ${active ? 'btn-active' : ''}" data-collection="${escapeHTML(id)}" aria-pressed="${active}">
    ${escapeHTML(name)} <span class="count">${count}</span>
  </button>
  `
}

const displayCollectionBar = () => {
  let favorites = getFavorites()
  let collections = getCollections()

  if (currentCollection !== ALL && !collections.some(collection => collection.id === currentCollection)) {
    setCurrentCollection(ALL)
  }

  if (favorites.length === 0 && collections.length === 0) {
    collectionBar.innerHTML = ''
    collectionActions.innerHTML = ''
    return
  }

  collectionBar.innerHTML = collectionButton(ALL, 'All', favorites.length)
    + collections.map(collection => {
      let count = favorites.filter(quote => isInCollection(quote, collection.id)).length
      return collectionButton(collection.id, collection.name, count)
    }).join('')
    + `<button class="new-collection-btn"><ion-icon name="add-outline" aria-hidden="true"></ion-icon> New collection</button>`

  collectionActions.innerHTML = currentCollection === ALL ? '' : `
  <button class="btn rename-collection-btn"><ion-icon name="pencil-outline" aria-hidden="true"></ion-icon> Rename</button>
  <button class="btn delete-collection-btn"><ion-icon name="trash-outline" aria-hidden="true"></ion-icon> Delete collection</button>
  `
}

const displayFavorites = () => {
  updateTitle()
  displayCollectionBar()

  let favorites = getFavorites()
  if (favorites.length === 0) {
    quotesWrapper.innerHTML = emptyMessage
    return
  }

  if (currentCollection !== ALL) {
    favorites = favorites.filter(quote => isInCollection(quote, currentCollection))
  }

  if (favorites.length === 0) {
    quotesWrapper.innerHTML = emptyCollectionMessage
    return
  }

  quotesWrapper.innerHTML = favorites.map((quote, i) => createQuoteCard(quote, i, { favoriteTools: true })).join('')
}

const refreshCard = (quoteId, action) => {
  displayCollectionBar()
  const card = findCard(quoteId)
  if (!card) return

  const quote = getFavorite(quoteId)
  if (!quote || (currentCollection !== ALL && !isInCollection(quote, currentCollection))) {
    let position = getCardPosition(quotesWrapper, quoteId)
    card.remove()
    if (!quotesWrapper.querySelector('.picture-quote')) displayFavorites()
    if (!focusCardAt(quotesWrapper, position, action)) focusCurrentCollection()
    return
  }

  card.outerHTML = createQuoteCard(quote, parseInt(card.dataset.wallpaper), { favoriteTools: true })
  findCard(quoteId).querySelector(`[data-action="${action}"]`).focus()
}

const showDialogQuote = (dialog, quote) => {
  dialog.querySelector('.dialog-quote').textContent = formatQuote(quote)
}

const updateNoteCount = () => {
  noteCount.textContent = `${noteText.value.length} / ${NOTE_MAX}`
}

const openNoteDialog = (quoteId) => {
  const quote = getFavorite(quoteId)
  if (!quote) return
  dialogQuoteId = quoteId

  showDialogQuote(noteDialog, quote)
  noteText.value = quote.note || ''
  noteDialog.querySelector('.delete-note-btn').classList.toggle('hide', !quote.note)
  updateNoteCount()
  noteDialog.showModal()
  noteText.focus()
}

const saveNote = (note) => {
  updateFavorite(dialogQuoteId, { note })
  noteDialog.close()
  refreshCard(dialogQuoteId, 'note')
  showToast(note ? 'Note saved' : 'Note deleted')
}

noteText.addEventListener('input', updateNoteCount)

noteDialog.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault()
  saveNote(noteText.value.trim())
})

noteDialog.querySelector('.delete-note-btn').addEventListener('click', () => saveNote(''))
noteDialog.querySelector('.cancel-btn').addEventListener('click', () => noteDialog.close())
closeOnBackdropClick(noteDialog)

const displayCollectionCheckboxes = () => {
  const quote = getFavorite(dialogQuoteId)
  let collections = getCollections()

  if (collections.length === 0) {
    collectionCheckboxes.innerHTML = `<p class="dialog-hint">You have no collections yet. Make your first one below.</p>`
    return
  }

  collectionCheckboxes.innerHTML = collections.map(collection => `
  <label class="checkbox-row">
    <input type="checkbox" value="${escapeHTML(collection.id)}" ${isInCollection(quote, collection.id) ? 'checked' : ''}>
    ${escapeHTML(collection.name)}
  </label>
  `).join('')
}

const openCollectionsDialog = (quoteId) => {
  const quote = getFavorite(quoteId)
  if (!quote) return
  dialogQuoteId = quoteId

  showDialogQuote(collectionsDialog, quote)
  newCollectionName.value = ''
  setFieldError(newCollectionName, newCollectionError, '')
  displayCollectionCheckboxes()
  collectionsDialog.showModal()
}

collectionCheckboxes.addEventListener('change', (e) => {
  setInCollection(dialogQuoteId, e.target.value, e.target.checked)
})

newCollectionForm.addEventListener('submit', (e) => {
  e.preventDefault()
  let name = newCollectionName.value.trim()
  let error = checkCollectionName(name)
  setFieldError(newCollectionName, newCollectionError, error)
  if (error) {
    newCollectionName.focus()
    return
  }

  const collection = createCollection(name)
  setInCollection(dialogQuoteId, collection.id, true)
  newCollectionName.value = ''
  displayCollectionCheckboxes()
  showToast(`Added to "${name}"`)
})

newCollectionName.addEventListener('input', () => setFieldError(newCollectionName, newCollectionError, ''))

collectionsDialog.querySelector('.done-btn').addEventListener('click', () => collectionsDialog.close())
closeOnBackdropClick(collectionsDialog)

collectionsDialog.addEventListener('close', () => refreshCard(dialogQuoteId, 'collections'))

const openCollectionNameDialog = (collectionId = null) => {
  renamingId = collectionId
  const collection = getCollections().find(c => c.id === collectionId)

  collectionNameTitle.textContent = collection ? 'Rename collection' : 'New collection'
  collectionName.value = collection ? collection.name : ''
  setFieldError(collectionName, collectionNameError, '')
  collectionNameDialog.showModal()
}

collectionNameDialog.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault()
  let name = collectionName.value.trim()
  let error = checkCollectionName(name, renamingId)
  setFieldError(collectionName, collectionNameError, error)
  if (error) {
    collectionName.focus()
    return
  }

  if (renamingId) {
    renameCollection(renamingId, name)
    showToast('Collection renamed')
  } else {
    setCurrentCollection(createCollection(name).id)
    showToast(`Collection "${name}" created`)
  }
  collectionNameDialog.close()
  displayFavorites()
  focusCurrentCollection()
})

collectionName.addEventListener('input', () => setFieldError(collectionName, collectionNameError, ''))
collectionNameDialog.querySelector('.cancel-btn').addEventListener('click', () => collectionNameDialog.close())
closeOnBackdropClick(collectionNameDialog)

collectionBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return

  if (btn.classList.contains('new-collection-btn')) {
    openCollectionNameDialog()
    return
  }

  setCurrentCollection(btn.dataset.collection)
  displayFavorites()
  focusCurrentCollection()
})

collectionActions.addEventListener('click', async (e) => {
  const btn = e.target.closest('button')
  if (!btn) return

  if (btn.classList.contains('rename-collection-btn')) {
    openCollectionNameDialog(currentCollection)
  }

  if (btn.classList.contains('delete-collection-btn')) {
    const collection = getCollections().find(c => c.id === currentCollection)
    let remove = await askToConfirm({
      title: `Delete "${collection.name}"?`,
      text: 'The quotes stay in your favorites.',
    })
    if (!remove) return

    deleteCollection(collection.id)
    setCurrentCollection(ALL)
    displayFavorites()
    focusCurrentCollection()
    showToast('Collection deleted')
  }
})

quotesWrapper.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="note"], [data-action="collections"]')
  if (!btn) return

  let quoteId = btn.closest('.picture-quote').dataset.id
  if (btn.dataset.action === 'note') {
    openNoteDialog(quoteId)
  } else {
    openCollectionsDialog(quoteId)
  }
})

document.addEventListener('favorites-changed', (e) => {
  if (e.detail.favorite) return

  const card = findCard(e.detail.quote.id)
  if (!card) return
  let position = getCardPosition(quotesWrapper, e.detail.quote.id)
  card.remove()

  updateTitle()
  displayCollectionBar()
  if (!quotesWrapper.querySelector('.picture-quote')) {
    displayFavorites()
  }
  if (!focusCardAt(quotesWrapper, position, 'favorite')) focusCurrentCollection()
})

displayFavorites()
