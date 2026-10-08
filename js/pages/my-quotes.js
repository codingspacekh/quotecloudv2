const title = document.querySelector('#my-quotes .title')
const form = document.querySelector('.quote-form')
const formTitle = document.querySelector('.quote-form .form-title')
const quoteText = document.querySelector('#quoteText')
const quoteTextError = document.querySelector('#quoteTextError')
const quoteTextCount = document.querySelector('#quoteTextCount')
const quoteAuthor = document.querySelector('#quoteAuthor')
const quoteAuthorError = document.querySelector('#quoteAuthorError')
const submitBtn = document.querySelector('.quote-form .submit-btn')
const cancelEditBtn = document.querySelector('.quote-form .cancel-edit-btn')
const quotesWrapper = document.querySelector('.quotes-wrapper')
const deleteDialog = document.querySelector('#deleteDialog')

const QUOTE_MIN = 10
const QUOTE_MAX = 300
const AUTHOR_MAX = 50

// the quote being edited, or null while writing a new one
let editingId = null
// the quote the delete window is asking about
let deletingId = null


// ---------- saving (localStorage) ----------

// Your quotes look like the API's quotes, so createQuoteCard() can show them:
// { id: 'my-1696800000000', mine: true, content, author: { name, slug: '' }, tags: [], wallpaper, createdAt }
const MY_QUOTES_KEY = 'myQuotes'

const getMyQuotes = () => {
  try {
    return JSON.parse(localStorage.getItem(MY_QUOTES_KEY)) || []
  } catch (error) {
    return []
  }
}

// returns false when the browser would not save them
const saveMyQuotes = (quotes) => {
  try {
    localStorage.setItem(MY_QUOTES_KEY, JSON.stringify(quotes))
    return true
  } catch (error) {
    showToast('Could not save your quotes in this browser')
    return false
  }
}


// ---------- checking the form ----------

// several spaces or new lines become one space
const cleanText = (text) => text.trim().replace(/\s+/g, ' ')

// returns the problems with the form, '' means that field is fine
const checkQuote = (text, author) => {
  let errors = { text: '', author: '' }

  if (!text) {
    errors.text = 'Please write a quote.'
  } else if (text.length < QUOTE_MIN) {
    errors.text = `Write at least ${QUOTE_MIN} letters (you have ${text.length}).`
  } else if (text.length > QUOTE_MAX) {
    errors.text = `Use at most ${QUOTE_MAX} letters (you have ${text.length}).`
  } else if (getMyQuotes().some(quote => quote.id !== editingId && quote.content.toLowerCase() === text.toLowerCase())) {
    errors.text = 'You already wrote this quote.'
  }

  if (author.length > AUTHOR_MAX) {
    errors.author = `Use at most ${AUTHOR_MAX} letters.`
  } else if (author && !/\p{L}/u.test(author)) {
    // \p{L} is any letter, in any language
    errors.author = 'A name needs at least one letter.'
  }

  return errors
}

const updateCount = () => {
  let length = quoteText.value.length
  quoteTextCount.textContent = `${length} / ${QUOTE_MAX}`
  // almost full
  quoteTextCount.classList.toggle('near-limit', length > QUOTE_MAX - 30)
}


// ---------- the form: add a new quote, or save changes ----------

const resetForm = () => {
  editingId = null
  form.reset()
  formTitle.textContent = 'Write your own quote'
  submitBtn.textContent = 'Add quote'
  cancelEditBtn.classList.add('hide')
  setFieldError(quoteText, quoteTextError, '')
  setFieldError(quoteAuthor, quoteAuthorError, '')
  updateCount()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()

  let text = cleanText(quoteText.value)
  let author = cleanText(quoteAuthor.value)
  const errors = checkQuote(text, author)
  setFieldError(quoteText, quoteTextError, errors.text)
  setFieldError(quoteAuthor, quoteAuthorError, errors.author)

  // put the keyboard on the first field with a problem
  if (errors.text) {
    quoteText.focus()
    return
  }
  if (errors.author) {
    quoteAuthor.focus()
    return
  }

  let quotes = getMyQuotes()
  let savedId = editingId

  if (editingId) {
    quotes = quotes.map(quote => {
      if (quote.id !== editingId) return quote
      return { ...quote, content: text, author: { name: author || 'Anonymous', slug: '' } }
    })
  } else {
    savedId = `my-${Date.now()}`
    // newest first
    quotes.unshift({
      id: savedId,
      mine: true,
      content: text,
      author: { name: author || 'Anonymous', slug: '' },
      tags: [],
      // the card keeps the same picture every time
      wallpaper: Math.floor(Math.random() * WALLPAPER_COUNT),
      createdAt: new Date().toISOString(),
    })
  }

  // not saved: keep what was typed
  if (!saveMyQuotes(quotes)) return

  showToast(editingId ? 'Quote updated' : 'Quote added')
  resetForm()
  displayMyQuotes()

  // show the card that was just saved
  const card = findCard(savedId)
  card.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
  card.querySelector('[data-action="edit"]').focus({ preventScroll: true })
})

quoteText.addEventListener('input', () => {
  updateCount()
  setFieldError(quoteText, quoteTextError, '')
})

quoteAuthor.addEventListener('input', () => setFieldError(quoteAuthor, quoteAuthorError, ''))

cancelEditBtn.addEventListener('click', () => {
  let id = editingId
  resetForm()
  displayMyQuotes()
  findCard(id).querySelector('[data-action="edit"]').focus()
})


// ---------- your quotes ----------

const findCard = (quoteId) => {
  return quotesWrapper.querySelector(`.picture-quote[data-id="${CSS.escape(quoteId)}"]`)
}

const displayMyQuotes = () => {
  let quotes = getMyQuotes()
  title.textContent = quotes.length ? `MY QUOTES (${quotes.length})` : `MY QUOTES`

  if (quotes.length === 0) {
    quotesWrapper.innerHTML = messageView('You have not written any quotes yet. Use the form above to write your first one!')
    return
  }

  quotesWrapper.innerHTML = quotes.map(quote => createQuoteCard(quote, quote.wallpaper)).join('')

  // the quote in the form gets a border
  if (editingId) {
    findCard(editingId).classList.add('is-editing')
  }
}

const startEditing = (quoteId) => {
  const quote = getMyQuotes().find(q => q.id === quoteId)
  if (!quote) return

  resetForm()
  editingId = quoteId
  quoteText.value = quote.content
  quoteAuthor.value = quote.author.name
  formTitle.textContent = 'Edit your quote'
  submitBtn.textContent = 'Save changes'
  cancelEditBtn.classList.remove('hide')
  updateCount()
  displayMyQuotes()

  form.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  quoteText.focus({ preventScroll: true })
}

// ---------- deleting a quote ----------

const openDeleteDialog = (quoteId) => {
  const quote = getMyQuotes().find(q => q.id === quoteId)
  if (!quote) return

  deletingId = quoteId
  deleteDialog.querySelector('.dialog-quote').textContent = `“${quote.content}” — ${quote.author.name}`
  deleteDialog.showModal()
}

const deleteQuote = () => {
  // remember where the card was, to put the keyboard on the card that takes its place
  let cards = [...quotesWrapper.querySelectorAll('.picture-quote')]
  let position = cards.indexOf(findCard(deletingId))

  if (!saveMyQuotes(getMyQuotes().filter(quote => quote.id !== deletingId))) return
  if (editingId === deletingId) resetForm()
  deleteDialog.close()
  displayMyQuotes()
  showToast('Quote deleted')

  // the next card (or the one before, if it was the last), or the form when none are left
  cards = quotesWrapper.querySelectorAll('.picture-quote')
  let nextCard = cards[Math.min(position, cards.length - 1)]
  if (nextCard) {
    nextCard.querySelector('[data-action="delete"]').focus()
  } else {
    quoteText.focus()
  }
}

deleteDialog.querySelector('.confirm-delete-btn').addEventListener('click', deleteQuote)
deleteDialog.querySelector('.cancel-btn').addEventListener('click', () => deleteDialog.close())

// clicking the dark area around the window closes it
deleteDialog.addEventListener('click', (e) => {
  if (e.target === deleteDialog) deleteDialog.close()
})

// the edit and delete buttons on the cards (quote-card.js handles copy, download, ...)
quotesWrapper.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="edit"], [data-action="delete"]')
  if (!btn) return

  let quoteId = btn.closest('.picture-quote').dataset.id
  if (btn.dataset.action === 'edit') {
    startEditing(quoteId)
  } else {
    openDeleteDialog(quoteId)
  }
})

resetForm()
displayMyQuotes()
