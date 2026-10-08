const title = document.querySelector('#authors .title')
const authorInfo = document.querySelector('.author-info')
const listWrapper = document.querySelector('.author-list')
const quotesWrapper = document.querySelector('.quotes-wrapper')
const btnGroup = document.querySelector('.btn-group')
const authorSearch = document.querySelector('.author-search')
const authorInput = document.querySelector('.author-search input')
const filters = document.querySelector('#authorFilters')
const letterBar = document.querySelector('.letter-bar')
const sortSelect = document.querySelector('#sortAuthors')
const resultCount = document.querySelector('.result-count')

const params = new URLSearchParams(window.location.search)
let slug = params.get('slug')

// limit must be 10, 25, 50 or 100 on this API
let AUTHORS_URL = `${API_URL}/authors?limit=100`
let AUTHOR_URL = `${API_URL}/authors/slug/`
let AUTHOR_QUOTES_URL = `${API_URL}/quotes?limit=100&author=`

const AUTHORS_PER_PAGE = 48
const LETTERS = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']

let allAuthors = []
let searchTerm = params.get('name') || ''
let letter = 'All'
let page = 0


// ---------- author.html (list of all authors) ----------

// The API can't search authors, so we load all of them once (about 800)
// and search, filter and sort them here in the browser.
// sessionStorage keeps them while the tab is open, so going back is instant.
const getAllAuthors = async () => {
  try {
    let saved = JSON.parse(sessionStorage.getItem('authors'))
    if (saved) return saved
  } catch (error) {
    // nothing saved, load them below
  }

  const firstPage = await fetchJSON(AUTHORS_URL + `&page=0`)
  let pageNumbers = []
  for (let i = 1; i <= firstPage.metadata.lastPage; i++) {
    pageNumbers.push(i)
  }
  // load the other pages at the same time
  const otherPages = await Promise.all(pageNumbers.map(i => fetchJSON(AUTHORS_URL + `&page=${i}`)))

  let authors = [firstPage, ...otherPages]
    .flatMap(data => data.data)
    .map(author => ({
      name: author.name,
      slug: author.slug,
      description: author.description,
      quotesCount: author.quotesCount,
    }))

  try {
    sessionStorage.setItem('authors', JSON.stringify(authors))
  } catch (error) {
    // too big or blocked, it will just load again next time
  }
  return authors
}

// "Émile Zola" -> "E", "14th Dalai Lama" -> "#"
const getFirstLetter = (name) => {
  let first = name.normalize('NFD').charAt(0).toUpperCase()
  return first >= 'A' && first <= 'Z' ? first : '#'
}

// "Émile" matches "emile" too
const simplify = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const getFilteredAuthors = () => {
  let search = simplify(searchTerm.trim())
  let authors = allAuthors.filter(author => {
    let matchesSearch = simplify(author.name).includes(search)
    let matchesLetter = letter === 'All' || getFirstLetter(author.name) === letter
    return matchesSearch && matchesLetter
  })

  if (sortSelect.value === 'name') {
    authors.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    authors.sort((a, b) => b.quotesCount - a.quotesCount || a.name.localeCompare(b.name))
  }
  return authors
}

const displayAuthors = (authors) => {
  listWrapper.innerHTML = authors.map(author => {
    return `
    <a href="author.html?slug=${encodeURIComponent(author.slug)}" class="author-card">
      <h3>${escapeHTML(author.name)}</h3>
      <p>${escapeHTML(author.description)}</p>
      <span class="count">${author.quotesCount} ${author.quotesCount === 1 ? 'quote' : 'quotes'}</span>
    </a>
    `
  }).join('')
}

const displayLetters = () => {
  letterBar.innerHTML = LETTERS.map(l => {
    return `<button class="${l === letter ? 'btn-active' : ''}" data-letter="${l}" aria-pressed="${l === letter}">${l}</button>`
  }).join('')
}

const updateAuthorList = () => {
  let authors = getFilteredAuthors()
  let lastPage = Math.max(0, Math.ceil(authors.length / AUTHORS_PER_PAGE) - 1)
  if (page > lastPage) page = lastPage

  resultCount.textContent = `${authors.length} ${authors.length === 1 ? 'author' : 'authors'}`
  displayLetters()

  if (authors.length === 0) {
    listWrapper.innerHTML = messageView('No authors found.')
    btnGroup.innerHTML = ''
    return
  }

  let start = page * AUTHORS_PER_PAGE
  displayAuthors(authors.slice(start, start + AUTHORS_PER_PAGE))
  btnGroup.innerHTML = createPageButtons(page, lastPage)
}

const getAuthors = async () => {
  listWrapper.innerHTML = loadingView
  try {
    allAuthors = await getAllAuthors()
    updateAuthorList()
  } catch (error) {
    console.log('some error occurred:', error.message)
    showError(listWrapper, 'Could not load authors.', getAuthors)
  }
}

onPageButtonClick(btnGroup, (newPage) => {
  page = newPage
  updateAuthorList()
})

letterBar.addEventListener('click', (e) => {
  let btn = e.target.closest('button')
  if (!btn) return

  letter = btn.dataset.letter
  page = 0
  updateAuthorList()
})

sortSelect.addEventListener('change', () => {
  page = 0
  updateAuthorList()
})


// ---------- author.html?slug=... (one author and their quotes) ----------

const displayAuthorInfo = (author) => {
  authorInfo.innerHTML = `
  <h3>${escapeHTML(author.name)}</h3>
  <p class="description">${escapeHTML(author.description)}</p>
  <p>${escapeHTML(author.bio)}</p>
  <a href="${escapeHTML(safeURL(author.link))}" class="link" target="_blank" rel="noopener">Read more on Wikipedia &RightArrow;</a>
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
    if (error.status === 404 || error.status === 422) {
      // the API says this author doesn't exist, trying again won't help
      title.textContent = `AUTHOR NOT FOUND`
      quotesWrapper.innerHTML = messageView('We could not find this author. <a href="author.html" class="link">See all authors</a>')
    } else {
      showError(quotesWrapper, 'Could not load this author.', getAuthor)
    }
  }
}


function start() {
  authorInput.value = searchTerm

  if (slug) {
    // on one author's page, searching goes back to the author list
    filters.classList.add('hide')
    resultCount.classList.add('hide')
    authorSearch.addEventListener('submit', (e) => {
      e.preventDefault()
      window.location.href = `author.html?name=${encodeURIComponent(authorInput.value.trim())}`
    })
    getAuthor()
  } else {
    title.textContent = `AUTHORS`
    // the list updates while you type
    authorSearch.addEventListener('submit', (e) => e.preventDefault())
    authorInput.addEventListener('input', () => {
      searchTerm = authorInput.value
      page = 0
      // still loading: the list uses searchTerm when it's ready
      if (allAuthors.length === 0) return
      updateAuthorList()
    })
    getAuthors()
  }
}

start()
