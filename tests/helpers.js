const base = require('@playwright/test')
const { useFakeAPI } = require('./fake-api')

const test = base.test.extend({
  page: async ({ page }, use) => {
    let errors = []
    page.on('pageerror', error => errors.push(error.message))
    await useFakeAPI(page)

    await use(page)

    base.expect(errors, 'a script on the page crashed').toEqual([])
  },
})

const saveInBrowser = async (page, data) => {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('test-data-saved')) return
    for (let key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]))
    }
    sessionStorage.setItem('test-data-saved', 'yes')
  }, data)
}

const favorite = (quote, extra = {}) => ({
  id: quote.id,
  content: quote.content,
  author: { name: quote.author.name, slug: quote.author.slug },
  tags: quote.tags.map(tag => ({ name: tag.name })),
  ...extra,
})

const card = (page, text) => page.locator('.picture-quote', { hasText: text })

const toast = (page) => page.locator('.toast')

const confirmDialog = (page) => page.locator('.confirm-dialog')

module.exports = { test, expect: base.expect, saveInBrowser, favorite, card, toast, confirmDialog }
