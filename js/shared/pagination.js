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

const onPageButtonClick = (btnGroup, onChange) => {
  btnGroup.addEventListener('click', (e) => {
    let btn = e.target.closest('button')
    if (!btn || btn.disabled) return

    onChange(parseInt(btn.dataset.page))
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  })
}
