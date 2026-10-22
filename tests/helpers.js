// Shared by every test file: use `test` and `expect` from here instead of '@playwright/test'
const base = require('@playwright/test')
const { useFakeAPI } = require('./fake-api')

// every test gets a page that talks to the pretend API (fake-api.js),
// and fails when a script on the page crashes, even if everything else looked fine
const test = base.test.extend({
  page: async ({ page }, use) => {
    let errors = []
    page.on('pageerror', error => errors.push(error.message))
    await useFakeAPI(page)

    await use(page)

    base.expect(errors, 'a script on the page crashed').toEqual([])
  },
})

// puts data in localStorage before the page's own scripts run.
// Only on the first page load, so after a reload the page still has what it saved itself.
const saveInBrowser = async (page, data) => {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('test-data-saved')) return
    for (let key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]))
    }
    sessionStorage.setItem('test-data-saved', 'yes')
  }, data)
}

// a quote saved the way toggleFavorite() saves it (js/shared/favorites-store.js),
// extra can add a note or collections: favorite(quote, { note: 'Nice' })
const favorite = (quote, extra = {}) => ({
  id: quote.id,
  content: quote.content,
  author: { name: quote.author.name, slug: quote.author.slug },
  tags: quote.tags.map(tag => ({ name: tag.name })),
  ...extra,
})

// the card that shows this text
const card = (page, text) => page.locator('.picture-quote', { hasText: text })

const toast = (page) => page.locator('.toast')

// the "Are you sure?" window from askToConfirm() (js/shared/ui.js)
const confirmDialog = (page) => page.locator('.confirm-dialog')

module.exports = { test, expect: base.expect, saveInBrowser, favorite, card, toast, confirmDialog }
