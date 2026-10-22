const randomBtn = document.querySelector('#randomQuoteBtn')
const todayQuoteTitle = document.querySelector('#today-quote .title')
const todayQuoteWrapper = document.querySelector('.today-quote-wrapper')
const quotesWrapper = document.querySelector('.quotes-wrapper')

const SINGLE_QUOTE_URL = `${API_URL}/quotes/random?maxLength=150`
const DAILY_PAGE_SIZE = 10
const DAILY_QUOTE_URL = `${API_URL}/quotes?limit=${DAILY_PAGE_SIZE}&maxLength=150`
const FAMOUS_QUOTE_URL = `${API_URL}/quotes?tags=Famous%20Quotes&limit=10&maxLength=100`
const FAMOUS_QUOTE_COUNT = 6

const getDayNumber = () => {
  const today = new Date()
  return Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000)
}

const getQuoteOfTheDay = async () => {
  randomBtn.disabled = true
  todayQuoteTitle.textContent = `QUOTE OF THE DAY`
  todayQuoteWrapper.innerHTML = quoteSkeletons(1)
  try {
    let data = await fetchJSON(DAILY_QUOTE_URL + `&page=0`)
    let quoteNumber = getDayNumber() % data.metadata.total
    let page = Math.floor(quoteNumber / DAILY_PAGE_SIZE)

    if (page !== 0) {
      data = await fetchJSON(DAILY_QUOTE_URL + `&page=${page}`)
    }

    let quote = data.data[quoteNumber % DAILY_PAGE_SIZE]
    todayQuoteWrapper.innerHTML = createQuoteCard(quote, getDayNumber())
  } catch (error) {
    console.error('Could not load the quote of the day:', error)
    showError(todayQuoteWrapper, 'Could not load the quote of the day.', getQuoteOfTheDay, error)
  }
  randomBtn.disabled = false
}

const getRandomQuote = async () => {
  randomBtn.disabled = true
  todayQuoteTitle.textContent = `RANDOM QUOTE`
  todayQuoteWrapper.innerHTML = quoteSkeletons(1)
  try {
    const data = await fetchJSON(SINGLE_QUOTE_URL)
    todayQuoteWrapper.innerHTML = createQuoteCard(data.quote)
  } catch (error) {
    console.error('Could not load a random quote:', error)
    showError(todayQuoteWrapper, 'Could not load a quote.', getRandomQuote, error)
  }
  randomBtn.disabled = false
}

const getFamousQuotes = async () => {
  quotesWrapper.innerHTML = quoteSkeletons(FAMOUS_QUOTE_COUNT)
  try {
    let page = Math.floor(Math.random() * 80)
    let data
    try {
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    } catch (error) {
      if (error.reason !== 'network' && error.reason !== 'timeout') throw error
      page = parseInt(loadSetting('famousPage', '0'))
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    }

    if (data.data.length === 0) {
      page = Math.floor(Math.random() * (data.metadata.lastPage + 1))
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    }
    saveSetting('famousPage', page)

    let quotes = data.data.slice(0, FAMOUS_QUOTE_COUNT)
    quotesWrapper.innerHTML = quotes.map((quote, i) => createQuoteCard(quote, i)).join('')
  } catch (error) {
    console.error('Could not load famous quotes:', error)
    showError(quotesWrapper, 'Could not load famous quotes.', getFamousQuotes, error)
  }
}

const start = () => {
  getQuoteOfTheDay()

  randomBtn.addEventListener('click', getRandomQuote)

  getFamousQuotes()
}

start()
