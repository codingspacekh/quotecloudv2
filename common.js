// Shared helpers used by every page (load this before the page's own script)

// api.quotable.io is deprecated, this is a community mirror with the same data
// Docs: https://github.com/Kurokeita/quotable
const API_URL = "https://api.quotable.kurokeita.dev/api"

// there are 10 wallpapers in ./images (wallpaper0.jpeg ... wallpaper9.jpeg)
const getWallpaper = (index = Math.floor(Math.random() * 10)) => {
  return `./images/wallpaper${index % 10}.jpeg`
}

// tags are objects like { id, name }
const getTags = (tags) => {
  let tagContents = ''
  for (let i = 0; i < tags.length; i++) {
    let tagName = tags[i].name
    tagContents += `<a href="quote.html?tag=${encodeURIComponent(tagName)}" class="link tag-link">${tagName}</a>`
  }
  return tagContents
}

// author is an object like { id, name, slug, description, bio, link }
const getAuthorLink = (author) => {
  return `<a href="author.html?slug=${encodeURIComponent(author.slug)}" class="link">${author.name}</a>`
}

// the quote text is shown once, on top of the picture
const createQuoteCard = (quote, imgIndex) => {
  return `
  <div class="picture-quote">
    <div class="frame" style="background-image: url('${getWallpaper(imgIndex)}');">
      <div class="overlay">
        <blockquote>${quote.content}</blockquote>
      </div>
    </div>
    <div class="content">
      <cite>${getAuthorLink(quote.author)}</cite>
      <div class="tags">
        ${getTags(quote.tags)}
      </div>
    </div>
  </div>
  `
}

const loadingView = `
<div class="loading">
  <div class="circle"></div>
</div>
`

const messageView = (message) => `<p class="message">${message}</p>`


// Some names in the API are stored with broken characters,
// e.g. "MoliÃ¨re" is saved as "Molié¨re" instead of "Molière".
// The broken text is really UTF-8 bytes read one byte per letter
// (with "Ã" also replaced by "é"), so we turn the letters back into bytes
// and decode them properly. Text that is already correct is returned unchanged.
const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

const fixText = (text) => {
  let restored = text.replace(/é([\x80-\xBF])/g, 'Ã$1')
  let codes = Array.from(restored, char => char.charCodeAt(0))

  // nothing to fix: plain English text, or a letter that can't be a byte
  if (codes.every(code => code < 128) || codes.some(code => code > 255)) {
    return text
  }

  try {
    return utf8Decoder.decode(new Uint8Array(codes))
  } catch (error) {
    // not valid UTF-8 bytes, so the text was already correct (e.g. "René")
    return text
  }
}

// run fixText on every string inside the API response
const fixData = (value) => {
  if (typeof value === 'string') return fixText(value)
  if (Array.isArray(value)) return value.map(fixData)
  if (value && typeof value === 'object') {
    let fixed = {}
    for (let key in value) {
      fixed[key] = fixData(value[key])
    }
    return fixed
  }
  return value
}

// returns the parsed JSON, or throws when the API answers with an error
const fetchJSON = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const data = await response.json()
  return fixData(data)
}


// Page buttons like:  ←  1 … 4 5 [6] 7 8 … 85  →
// page and lastPage start at 0, each button keeps its page in data-page
const createPageButtons = (page, lastPage) => {
  if (lastPage <= 0) return ''

  let btns = []
  let addButton = (pageIndex) => {
    btns.push(`<button class="btn ${page === pageIndex ? 'btn-active' : ''}" data-page="${pageIndex}">${pageIndex + 1}</button>`)
  }

  let start = Math.max(1, page - 2)
  let end = Math.min(lastPage - 1, page + 2)

  addButton(0)
  if (start > 1) btns.push(`<span class="dots">&hellip;</span>`)
  for (let i = start; i <= end; i++) {
    addButton(i)
  }
  if (end < lastPage - 1) btns.push(`<span class="dots">&hellip;</span>`)
  addButton(lastPage)

  btns.unshift(`<button class="prevBtn" data-page="${page - 1}" ${page === 0 ? 'disabled' : ''} aria-label="Previous page">&LeftArrow;</button>`)
  btns.push(`<button class="nextBtn" data-page="${page + 1}" ${page === lastPage ? 'disabled' : ''} aria-label="Next page">&RightArrow;</button>`)
  return btns.join('')
}

// calls onChange(newPage) when one of the page buttons is clicked
const onPageButtonClick = (btnGroup, onChange) => {
  btnGroup.addEventListener('click', (e) => {
    let btn = e.target.closest('button')
    if (!btn || btn.disabled) return

    onChange(parseInt(btn.dataset.page))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}


// every search form on the site sends you to the quotes page
const setupSearchForms = () => {
  const searchForms = document.querySelectorAll('.search-form')
  searchForms.forEach(form => {
    const input = form.querySelector('input[type="search"]')

    form.addEventListener('submit', (e) => {
      e.preventDefault()

      let searchTerm = input.value.trim()
      if (!searchTerm) return

      window.location.href = `quote.html?query=${encodeURIComponent(searchTerm)}`
    })
  })
}

const setFooterYear = () => {
  const year = document.querySelector('footer .year')
  if (year) {
    year.textContent = new Date().getFullYear()
  }
}

setupSearchForms()
setFooterYear()
