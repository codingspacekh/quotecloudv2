const tagsWrapper = document.querySelector('.tag-list')

let TAGS_URL = `${API_URL}/tags`


const getAllTags = async () => {
  tagsWrapper.innerHTML = loadingView
  try {
    // returns an array like [{ id, name, quotesCount }]
    const tags = await fetchJSON(TAGS_URL)

    // most used tags first, and hide tags without quotes
    let sortedTags = tags
      .filter(tag => tag.quotesCount > 0)
      .sort((a, b) => b.quotesCount - a.quotesCount)

    tagsWrapper.innerHTML = sortedTags.map(tag => {
      return `
      <a href="quote.html?tag=${encodeURIComponent(tag.name)}" class="link tag-card">
        ${escapeHTML(tag.name)} <span class="count">${tag.quotesCount}</span>
      </a>
      `
    }).join('')

  } catch (error) {
    console.log('some error occurred:', error.message)
    showError(tagsWrapper, 'Could not load tags.', getAllTags)
  }
}

getAllTags()
