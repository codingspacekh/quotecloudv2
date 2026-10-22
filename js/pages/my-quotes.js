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

const QUOTE_MIN = 10
const QUOTE_MAX = 300
const AUTHOR_MAX = 50

let editingId = null

const MY_QUOTES_KEY = 'myQuotes'

const getMyQuotes = () => loadJSON(MY_QUOTES_KEY, [])

const saveMyQuotes = (quotes) => {
  if (saveJSON(MY_QUOTES_KEY, quotes)) return true
  showToast('Could not save your quotes in this browser')
  return false
}

const cleanText = (text) => text.trim().replace(/\s+/g, ' ')

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
    errors.author = 'A name needs at least one letter.'
  }

  return errors
}

const updateCount = () => {
  let length = quoteText.value.length
  quoteTextCount.textContent = `${length} / ${QUOTE_MAX}`
  quoteTextCount.classList.toggle('near-limit', length > QUOTE_MAX - 30)
}

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
    quotes.unshift({
      id: savedId,
      mine: true,
      content: text,
      author: { name: author || 'Anonymous', slug: '' },
      tags: [],
      wallpaper: Math.floor(Math.random() * WALLPAPER_COUNT),
      createdAt: new Date().toISOString(),
    })
  }

  if (!saveMyQuotes(quotes)) return

  showToast(editingId ? 'Quote updated' : 'Quote added')
  resetForm()
  displayMyQuotes()

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

const displayMyQuotes = () => {
  let quotes = getMyQuotes()
  title.textContent = quotes.length ? `MY QUOTES (${quotes.length})` : `MY QUOTES`

  if (quotes.length === 0) {
    quotesWrapper.innerHTML = messageView('You have not written any quotes yet. Use the form above to write your first one!')
    return
  }

  quotesWrapper.innerHTML = quotes.map(quote => createQuoteCard(quote, quote.wallpaper)).join('')

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

const deleteQuote = async (quoteId) => {
  const quote = getMyQuotes().find(q => q.id === quoteId)
  if (!quote) return

  let remove = await askToConfirm({ title: 'Delete this quote?', text: 'This cannot be undone.', quote })
  if (!remove) return

  let position = getCardPosition(quotesWrapper, quoteId)

  if (!saveMyQuotes(getMyQuotes().filter(q => q.id !== quoteId))) return
  if (editingId === quoteId) resetForm()
  displayMyQuotes()
  showToast('Quote deleted')

  if (!focusCardAt(quotesWrapper, position, 'delete')) quoteText.focus()
}

quotesWrapper.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="edit"], [data-action="delete"]')
  if (!btn) return

  let quoteId = btn.closest('.picture-quote').dataset.id
  if (btn.dataset.action === 'edit') {
    startEditing(quoteId)
  } else {
    deleteQuote(quoteId)
  }
})

resetForm()
displayMyQuotes()
