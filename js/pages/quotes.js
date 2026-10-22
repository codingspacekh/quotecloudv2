const title = document.querySelector('#quotes .title')
const quotesWrapper = document.querySelector('.quotes-wrapper')
const btnGroup = document.querySelector('.btn-group')
const searchInput = document.querySelector('#quotes .search-form input')
const lengthFilter = document.querySelector('#lengthFilter')

const params = new URLSearchParams(window.location.search)
let query = params.get('query')
let tag = params.get('tag')
let quoteLength = params.get('length') || loadSetting('quoteLength', 'all')

const QUOTES_URL = `${API_URL}/quotes?limit=25`

const LENGTHS = {
  all: '',
  short: '&maxLength=60',
  medium: '&minLength=60&maxLength=150',
  long: '&minLength=150',
}

let page = 0
let lastPage = 0
let loadNumber = 0

const getQuotesURL = () => {
  let url = QUOTES_URL + `&page=${page}` + (LENGTHS[quoteLength] || '')
  if (query) {
    url += `&query=${encodeURIComponent(query)}`
  } else if (tag) {
    url += `&tags=${encodeURIComponent(tag)}`
  }
  return url
}

const displayQuotes = (quotes) => {
  quotesWrapper.innerHTML = quotes.map(quote => createQuoteCard(quote)).join('')
}

const getQuotes = async () => {
  let thisLoad = ++loadNumber
  quotesWrapper.innerHTML = quoteSkeletons(6)
  btnGroup.innerHTML = ``
  try {
    const data = await fetchJSON(getQuotesURL())
    if (thisLoad !== loadNumber) return
    let quotes = data.data
    lastPage = data.metadata.lastPage

    if (quotes.length === 0) {
      quotesWrapper.innerHTML = messageView('No quotes found. Try another search or quote length.')
      return
    }

    displayQuotes(quotes)
    btnGroup.innerHTML = createPageButtons(page, lastPage)
  } catch (error) {
    if (thisLoad !== loadNumber) return
    console.error('Could not load quotes:', error)
    showError(quotesWrapper, 'Could not load quotes.', getQuotes, error)
  }
}

onPageButtonClick(btnGroup, (newPage) => {
  page = newPage
  getQuotes()
})

lengthFilter.addEventListener('change', () => {
  quoteLength = lengthFilter.value
  page = 0
  saveSetting('quoteLength', quoteLength)
  setURLParam('length', quoteLength === 'all' ? null : quoteLength)
  getQuotes()
})

const start = () => {
  let heading = `Quotes`
  if (query) {
    heading = `${query} Quotes`
    searchInput.value = query
  } else if (tag) {
    heading = `${tag} Quotes`
  }

  if (!LENGTHS.hasOwnProperty(quoteLength)) quoteLength = 'all'
  lengthFilter.value = quoteLength

  title.textContent = heading.toUpperCase()
  document.title = `${heading} | Quote Cloud`

  getQuotes()
}

start()
