const randomBtn = document.querySelector('#randomQuoteBtn')
const todayQuoteTitle = document.querySelector('#today-quote .title')
const todayQuoteWrapper = document.querySelector('.today-quote-wrapper')
const quotesWrapper = document.querySelector('.quotes-wrapper')

let SINGLE_QUOTE_URL = `${API_URL}/quotes/random?maxLength=150`
// limit must be 10, 25, 50 or 100 on this API
let DAILY_QUOTE_URL = `${API_URL}/quotes?limit=10&maxLength=150`
let FAMOUS_QUOTE_URL = `${API_URL}/quotes?tags=Famous%20Quotes&limit=10&maxLength=100`
let FAMOUS_QUOTE_COUNT = 6


// a number that goes up by 1 every day (based on the visitor's own date)
const getDayNumber = () => {
  const today = new Date()
  return Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000)
}

// everyone gets the same quote on the same day:
// the day number picks one quote out of the whole list
const getQuoteOfTheDay = async () => {
  todayQuoteTitle.textContent = `QUOTE OF THE DAY`
  todayQuoteWrapper.innerHTML = quoteSkeletons(1)
  try {
    // the first page also tells us how many quotes there are
    let data = await fetchJSON(DAILY_QUOTE_URL + `&page=0`)
    let quoteNumber = getDayNumber() % data.metadata.total
    let page = Math.floor(quoteNumber / 10)

    if (page !== 0) {
      data = await fetchJSON(DAILY_QUOTE_URL + `&page=${page}`)
    }

    let quote = data.data[quoteNumber % 10]
    todayQuoteWrapper.innerHTML = createQuoteCard(quote, getDayNumber())

  } catch (error) {
    console.log('some error occurred:', error.message)
    showError(todayQuoteWrapper, 'Could not load the quote of the day.', getQuoteOfTheDay, error)
  }
}

const getRandomQuote = async () => {
  // stop extra clicks while a quote is loading,
  // otherwise an older answer could replace a newer one
  randomBtn.disabled = true
  todayQuoteTitle.textContent = `RANDOM QUOTE`
  todayQuoteWrapper.innerHTML = quoteSkeletons(1)
  try {
    const data = await fetchJSON(SINGLE_QUOTE_URL)

    let quote = data.quote
    // console.log(quote)
    todayQuoteWrapper.innerHTML = createQuoteCard(quote)

  } catch (error) {
    console.log('some error occurred:', error.message)
    showError(todayQuoteWrapper, 'Could not load a quote.', getRandomQuote, error)
  }
  randomBtn.disabled = false
}


const getFamousQuotes = async () => {
  quotesWrapper.innerHTML = quoteSkeletons(FAMOUS_QUOTE_COUNT)
  try {
    // pages start at 0, there are about 80 pages of famous quotes
    let page = Math.floor(Math.random() * 80)
    let data
    try {
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    } catch (error) {
      if (error.reason !== 'network' && error.reason !== 'timeout') throw error
      // no internet: only pages seen before are saved (see sw.js), so show the last one again
      page = parseInt(loadSetting('famousPage', '0'))
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    }

    // if there are fewer pages now, pick again using the real page count
    if (data.data.length === 0) {
      page = Math.floor(Math.random() * (data.metadata.lastPage + 1))
      data = await fetchJSON(FAMOUS_QUOTE_URL + `&page=${page}`)
    }
    saveSetting('famousPage', page)

    let quotes = data.data.slice(0, FAMOUS_QUOTE_COUNT)
    quotesWrapper.innerHTML = quotes.map((quote, i) => createQuoteCard(quote, i)).join('')

  } catch (error) {
    console.log('some error occurred:', error.message)
    showError(quotesWrapper, 'Could not load famous quotes.', getFamousQuotes, error)
  }
}

function start() {
  getQuoteOfTheDay()

  randomBtn.addEventListener('click', getRandomQuote)

  getFamousQuotes()
}

start()
