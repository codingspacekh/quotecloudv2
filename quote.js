const title = document.querySelector('#quotes .title')
const quotesWrapper = document.querySelector('.quotes-wrapper')
const btnGroup = document.querySelector('.btn-group')
const searchInput = document.querySelector('#quotes .search-form input')

const params = new URLSearchParams(window.location.search)
let query = params.get('query')
let tag = params.get('tag')

// limit must be 10, 25, 50 or 100 on this API
let QUOTES_URL = `${API_URL}/quotes?limit=25`

// the API does the paging for us, pages start at 0
let page = 0
let lastPage = 0


const getQuotesURL = () => {
  let url = QUOTES_URL + `&page=${page}`
  if (query) {
    url += `&query=${encodeURIComponent(query)}`
  } else if (tag) {
    url += `&tags=${encodeURIComponent(tag)}`
  }
  return url
}

function displayQuotes(quotes) {
  quotesWrapper.innerHTML = quotes.map(quote => createQuoteCard(quote)).join('')
}

const getQuotes = async () => {
  quotesWrapper.innerHTML = loadingView
  btnGroup.innerHTML = ``
  try {
    const data = await fetchJSON(getQuotesURL())
    // the quotes are in "data", paging info is in "metadata"
    let quotes = data.data
    lastPage = data.metadata.lastPage

    if (quotes.length === 0) {
      quotesWrapper.innerHTML = messageView('No quotes found. Try another search.')
      return
    }

    displayQuotes(quotes)
    btnGroup.innerHTML = createPageButtons(page, lastPage)
  } catch (error) {
    console.log('some error may occur', error.message)
    quotesWrapper.innerHTML = messageView('Could not load quotes. Please try again.')
  }
}

onPageButtonClick(btnGroup, (newPage) => {
  page = newPage
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

  title.textContent = heading.toUpperCase()
  document.title = `${heading} | Quote Cloud`

  getQuotes()
}


start()
