// A pretend quotes API for the tests.
// It answers like the real one (https://github.com/Kurokeita/quotable), but always with
// the same quotes, so the tests don't need the internet and give the same result every time.

// every request to the real API goes to answer() below instead
const API = '**/api.quotable.kurokeita.dev/api/**'


// ---------- authors ----------

// "Molière" saved with broken letters, like some names in the real API:
// its UTF-8 bytes read one byte per letter, with "Ã" turned into "é" (see fixText in js/shared/api.js)
const BROKEN_MOLIERE = Buffer.from('Molière', 'utf8').toString('latin1').replace('Ã', 'é')

const AUTHORS = [
  { name: 'Albert Einstein', slug: 'albert-einstein', description: 'Physicist', bio: 'Developed the theory of relativity.', link: 'https://en.wikipedia.org/wiki/Albert_Einstein' },
  // a dangerous link: the page must never put it in an href
  { name: 'Émile Zola', slug: 'emile-zola', description: 'French novelist', bio: 'Wrote Germinal.', link: 'javascript:alert(1)' },
  { name: BROKEN_MOLIERE, slug: 'moliere', description: 'French playwright', bio: 'Wrote Tartuffe.', link: 'https://en.wikipedia.org/wiki/Moli%C3%A8re' },
  { name: '14th Dalai Lama', slug: '14th-dalai-lama', description: 'Spiritual leader', bio: 'Leader of Tibetan Buddhism.', link: 'https://en.wikipedia.org/wiki/14th_Dalai_Lama' },
]

// lots of extra authors, so the authors page needs more than one page
for (let i = 1; i <= 116; i++) {
  let number = String(i).padStart(3, '0')
  AUTHORS.push({ name: `Writer ${number}`, slug: `writer-${number}`, description: 'Writer', bio: '', link: '' })
}


// ---------- quotes ----------

const makeQuote = (id, content, author, tagNames) => ({
  id,
  content,
  author: { id: author.slug, name: author.name, slug: author.slug },
  tags: tagNames.map(name => ({ id: name, name })),
})

// short (under 60 letters), medium (60 - 150) or long (over 150), so the length filter can be tested
const makeContent = (n) => {
  let start = `Quote number ${n}:`
  if (n === 42) return `${start} life is like a pineapple, sweet inside.`
  if (n % 3 === 0) return `${start} ${'a long thought that keeps going and going '.repeat(4).trim()}.`
  if (n % 3 === 1) return `${start} keep it short.`
  return `${start} ${'a medium sized thought '.repeat(3).trim()}.`
}

const QUOTES = []

// q1 ... q60, shared between the first four authors
for (let n = 1; n <= 60; n++) {
  QUOTES.push(makeQuote(`q${n}`, makeContent(n), AUTHORS[n % 4], [n % 4 === 0 ? 'Love' : 'Life']))
}

// f1 ... f20, for "Famous quotes" on the home page
for (let n = 1; n <= 20; n++) {
  QUOTES.push(makeQuote(`f${n}`, `Famous words number ${n}.`, AUTHORS[0], ['Famous Quotes']))
}

// HTML inside a quote must be shown as text, never run
QUOTES.push(makeQuote('danger', '<img src=x onerror="window.hacked = true">Hello there', AUTHORS[0], ['Danger']))

const getQuote = (id) => QUOTES.find(quote => quote.id === id)

// how many quotes each author and tag has, like the real API tells us
const countQuotes = (test) => QUOTES.filter(test).length

const AUTHOR_LIST = AUTHORS.map(author => ({
  ...author,
  quotesCount: countQuotes(quote => quote.author.slug === author.slug),
}))

const TAGS = ['Life', 'Love', 'Famous Quotes', 'Danger', 'Empty'].map(name => ({
  id: name,
  name,
  quotesCount: countQuotes(quote => quote.tags.some(tag => tag.name === name)),
}))


// ---------- answering requests ----------

// filters like the real API: ?query= ?tags= ?author= ?minLength= ?maxLength=
const findQuotes = (params) => {
  let quotes = QUOTES
  let query = params.get('query')
  let tag = params.get('tags')
  let author = params.get('author')
  let minLength = parseInt(params.get('minLength'))
  let maxLength = parseInt(params.get('maxLength'))

  if (query) quotes = quotes.filter(quote => quote.content.toLowerCase().includes(query.toLowerCase()))
  if (tag) quotes = quotes.filter(quote => quote.tags.some(t => t.name === tag))
  if (author) quotes = quotes.filter(quote => quote.author.slug === author)
  if (minLength) quotes = quotes.filter(quote => quote.content.length >= minLength)
  if (maxLength) quotes = quotes.filter(quote => quote.content.length <= maxLength)
  return quotes
}

// one page of a list, pages start at 0: { data: [...], metadata: { total, page, lastPage } }
const onePage = (items, params) => {
  let limit = parseInt(params.get('limit') || '10')
  let page = parseInt(params.get('page') || '0')
  return {
    data: items.slice(page * limit, (page + 1) * limit),
    metadata: { total: items.length, page, lastPage: Math.max(0, Math.ceil(items.length / limit) - 1) },
  }
}

// the API is on another website, so it has to allow our page to read the answer
const reply = (route, body, status = 200, headers = {}) => {
  return route.fulfill({
    status,
    json: body,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'X-Saved-Copy',
      ...headers,
    },
  })
}

const answer = (route) => {
  const url = new URL(route.request().url())
  const path = url.pathname.replace('/api/', '')
  const params = url.searchParams

  if (path === 'quotes/random') {
    let quotes = findQuotes(params)
    return reply(route, { quote: quotes[Math.floor(Math.random() * quotes.length)] })
  }
  if (path === 'quotes') return reply(route, onePage(findQuotes(params), params))
  if (path === 'tags') return reply(route, TAGS)
  if (path === 'authors') return reply(route, onePage(AUTHOR_LIST, params))

  if (path.startsWith('authors/slug/')) {
    let slug = decodeURIComponent(path.replace('authors/slug/', ''))
    let author = AUTHOR_LIST.find(a => a.slug === slug)
    if (author) return reply(route, author)
  }
  return reply(route, { message: 'Not found' }, 404)
}

// Instead of the real icons (ionicons from unpkg.com): an empty <ion-icon> the size of a letter.
// Without any size, a button that only has an icon (like the theme button) could not be clicked.
const FAKE_ICONS = `
customElements.define('ion-icon', class extends HTMLElement {
  connectedCallback() {
    this.style.cssText = 'display: inline-block; width: 1em; height: 1em;'
  }
})
`

// sends the page's API requests to answer(), and uses pretend icons and no font
// (they come from other websites and aren't needed to test the page)
const useFakeAPI = async (page) => {
  await page.route(API, answer)
  await page.route('**/unpkg.com/**', route => route.fulfill({ contentType: 'text/javascript', body: FAKE_ICONS }))
  await page.route('**/fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
}

module.exports = { API, AUTHORS, QUOTES, BROKEN_MOLIERE, getQuote, reply, useFakeAPI }
