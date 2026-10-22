const tagsWrapper = document.querySelector('.tag-list')

const TAGS_URL = `${API_URL}/tags`

const getAllTags = async () => {
  tagsWrapper.innerHTML = tagSkeletons(20)
  try {
    const tags = await fetchJSON(TAGS_URL)

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
    console.error('Could not load tags:', error)
    showError(tagsWrapper, 'Could not load tags.', getAllTags, error)
  }
}

getAllTags()
