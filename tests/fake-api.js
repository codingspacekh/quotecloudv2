const API = '**/api.quotable.kurokeita.dev/api/**'

const BROKEN_MOLIERE = Buffer.from('Molière', 'utf8').toString('latin1').replace('Ã', 'é')

const AUTHORS = [
  { name: 'Albert Einstein', slug: 'albert-einstein', description: 'Physicist', bio: 'Developed the theory of relativity.', link: 'https://en.wikipedia.org/wiki/Albert_Einstein' },
  { name: 'Émile Zola', slug: 'emile-zola', description: 'French novelist', bio: 'Wrote Germinal.', link: 'javascript:alert(1)' },
  { name: BROKEN_MOLIERE, slug: 'moliere', description: 'French playwright', bio: 'Wrote Tartuffe.', link: 'https://en.wikipedia.org/wiki/Moli%C3%A8re' },
  { name: '14th Dalai Lama', slug: '14th-dalai-lama', description: 'Spiritual leader', bio: 'Leader of Tibetan Buddhism.', link: 'https://en.wikipedia.org/wiki/14th_Dalai_Lama' },
]

for (let i = 1; i <= 116; i++) {
  let number = String(i).padStart(3, '0')
  AUTHORS.push({ name: `Writer ${number}`, slug: `writer-${number}`, description: 'Writer', bio: '', link: '' })
}

const makeQuote = (id, content, author, tagNames) => ({
  id,
  content,
  author: { id: author.slug, name: author.name, slug: author.slug },
  tags: tagNames.map(name => ({ id: name, name })),
})

const makeContent = (n) => {
  let start = `Quote number ${n}:`
  if (n === 42) return `${start} life is like a pineapple, sweet inside.`
  if (n % 3 === 0) return `${start} ${'a long thought that keeps going and going '.repeat(4).trim()}.`
  if (n % 3 === 1) return `${start} keep it short.`
  return `${start} ${'a medium sized thought '.repeat(3).trim()}.`
}

const QUOTES = []

for (let n = 1; n <= 60; n++) {
  QUOTES.push(makeQuote(`q${n}`, makeContent(n), AUTHORS[n % 4], [n % 4 === 0 ? 'Love' : 'Life']))
}

for (let n = 1; n <= 20; n++) {
  QUOTES.push(makeQuote(`f${n}`, `Famous words number ${n}.`, AUTHORS[0], ['Famous Quotes']))
}

QUOTES.push(makeQuote('danger', '<img src=x onerror="window.hacked = true">Hello there', AUTHORS[0], ['Danger']))

const getQuote = (id) => QUOTES.find(quote => quote.id === id)

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

const onePage = (items, params) => {
  let limit = parseInt(params.get('limit') || '10')
  let page = parseInt(params.get('page') || '0')
  return {
    data: items.slice(page * limit, (page + 1) * limit),
    metadata: { total: items.length, page, lastPage: Math.max(0, Math.ceil(items.length / limit) - 1) },
  }
}

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

const FAKE_ICONS = `
customElements.define('ion-icon', class extends HTMLElement {
  connectedCallback() {
    this.style.cssText = 'display: inline-block; width: 1em; height: 1em;'
  }
})
`

const useFakeAPI = async (page) => {
  await page.route(API, answer)
  await page.route('**/unpkg.com/**', route => route.fulfill({ contentType: 'text/javascript', body: FAKE_ICONS }))
  await page.route('**/fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
}

module.exports = { API, AUTHORS, QUOTES, BROKEN_MOLIERE, getQuote, reply, useFakeAPI }
