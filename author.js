const title = document.querySelector('#authors .title')
const authorInfo = document.querySelector('.author-info')
const listWrapper = document.querySelector('.author-list')
const quotesWrapper = document.querySelector('.quotes-wrapper')
const btnGroup = document.querySelector('.btn-group')

const params = new URLSearchParams(window.location.search)
let slug = params.get('slug')

// limit must be 10, 25, 50 or 100 on this API
let AUTHORS_URL = `${API_URL}/authors?limit=50&sortBy=quotesCount&order=desc`
let AUTHOR_URL = `${API_URL}/authors/slug/`
let AUTHOR_QUOTES_URL = `${API_URL}/quotes?limit=100&author=`

// pages start at 0 on this API
let page = 0
let lastPage = 0


// ---------- author.html (list of all authors) ----------

const displayAuthors = (authors) => {
  listWrapper.innerHTML = authors.map(author => {
    return `
    <a href="author.html?slug=${encodeURIComponent(author.slug)}" class="author-card">
      <h3>${author.name}</h3>
      <p>${author.description}</p>
      <span class="count">${author.quotesCount} ${author.quotesCount === 1 ? 'quote' : 'quotes'}</span>
    </a>
    `
  }).join('')
}

const getAuthors = async () => {
  listWrapper.innerHTML = loadingView
  try {
    const data = await fetchJSON(AUTHORS_URL + `&page=${page}`)
    lastPage = data.metadata.lastPage

    displayAuthors(data.data)
    btnGroup.innerHTML = createPageButtons(page, lastPage)
  } catch (error) {
    console.log('some error occurred:', error.message)
    listWrapper.innerHTML = messageView('Could not load authors.')
  }
}

onPageButtonClick(btnGroup, (newPage) => {
  page = newPage
  getAuthors()
})


// ---------- author.html?slug=... (one author and their quotes) ----------

const displayAuthorInfo = (author) => {
  authorInfo.innerHTML = `
  <h3>${author.name}</h3>
  <p class="description">${author.description}</p>
  <p>${author.bio}</p>
  <a href="${author.link}" class="link" target="_blank" rel="noopener">Read more on Wikipedia &RightArrow;</a>
  `
}

const getAuthor = async () => {
  quotesWrapper.innerHTML = loadingView
  try {
    // author details and their quotes can load at the same time
    const [author, quotesData] = await Promise.all([
      fetchJSON(AUTHOR_URL + encodeURIComponent(slug)),
      fetchJSON(AUTHOR_QUOTES_URL + encodeURIComponent(slug)),
    ])

    title.textContent = `${author.name.toUpperCase()} QUOTES`
    document.title = `${author.name} Quotes | Quote Cloud`
    displayAuthorInfo(author)

    let quotes = quotesData.data
    quotesWrapper.innerHTML = quotes.map((quote, i) => createQuoteCard(quote, i)).join('')
  } catch (error) {
    console.log('some error occurred:', error.message)
    title.textContent = `AUTHOR NOT FOUND`
    quotesWrapper.innerHTML = messageView('Could not load this author. <a href="author.html" class="link">See all authors</a>')
  }
}


function start() {
  if (slug) {
    getAuthor()
  } else {
    title.textContent = `AUTHORS`
    getAuthors()
  }
}

start()
