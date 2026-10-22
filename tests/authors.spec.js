// author.html: the list of authors, and one author's page (js/pages/authors.js)
const { test, expect } = require('./helpers')
const { QUOTES } = require('./fake-api')

const authorNames = (page) => page.locator('.author-card h3')

test.describe('authors list', () => {
  test('shows 48 authors per page, the ones with most quotes first', async ({ page }) => {
    await page.goto('author.html')

    await expect(page.locator('#authors .title')).toHaveText('AUTHORS')
    await expect(page.locator('.result-count')).toHaveText('120 authors')
    await expect(page.locator('.author-card')).toHaveCount(48)
    await expect(authorNames(page).first()).toHaveText('Albert Einstein')
    await expect(page.locator('.btn-group .btn').last()).toHaveText('3')

    await page.locator('.btn-group').getByRole('button', { name: '3', exact: true }).click()
    // 120 - 48 - 48
    await expect(page.locator('.author-card')).toHaveCount(24)
  })

  test('search ignores accents: "emile" finds "Émile Zola"', async ({ page }) => {
    await page.goto('author.html')
    await expect(page.locator('.author-card')).toHaveCount(48)

    await page.getByRole('searchbox', { name: 'Search authors' }).fill('emile')
    await expect(authorNames(page)).toHaveText(['Émile Zola'])
    await expect(page.locator('.result-count')).toHaveText('1 author')

    // the broken name from the API is fixed first, then found without its accent
    await page.getByRole('searchbox', { name: 'Search authors' }).fill('moliere')
    await expect(authorNames(page)).toHaveText(['Molière'])

    await page.getByRole('searchbox', { name: 'Search authors' }).fill('nobody at all')
    await expect(page.locator('.message')).toHaveText('No authors found.')
  })

  test('a search in the address fills the search box', async ({ page }) => {
    await page.goto('author.html?name=writer')
    await expect(page.getByRole('searchbox', { name: 'Search authors' })).toHaveValue('writer')
    await expect(page.locator('.result-count')).toHaveText('116 authors')
  })

  test('the letter buttons filter by first letter', async ({ page }) => {
    await page.goto('author.html')
    const letters = page.locator('.letter-bar')

    await letters.getByRole('button', { name: '#', exact: true }).click()
    await expect(authorNames(page)).toHaveText(['14th Dalai Lama'])
    await expect(letters.getByRole('button', { name: '#', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await letters.getByRole('button', { name: 'E', exact: true }).click()
    await expect(authorNames(page)).toHaveText(['Émile Zola'])

    await letters.getByRole('button', { name: 'All', exact: true }).click()
    await expect(page.locator('.result-count')).toHaveText('120 authors')
  })

  test('sorting by name is remembered next time', async ({ page }) => {
    await page.goto('author.html')
    await expect(page.locator('.author-card')).toHaveCount(48)

    await page.selectOption('#sortAuthors', 'name')
    await expect(authorNames(page).first()).toHaveText('14th Dalai Lama')

    await page.reload()
    await expect(page.locator('#sortAuthors')).toHaveValue('name')
    await expect(authorNames(page).first()).toHaveText('14th Dalai Lama')
  })

  test('clicking an author opens their page', async ({ page }) => {
    await page.goto('author.html')
    await authorNames(page).first().click()
    await expect(page).toHaveURL(/author\.html\?slug=albert-einstein$/)
  })
})

test.describe('one author', () => {
  test('shows the author and all their quotes', async ({ page }) => {
    await page.goto('author.html?slug=albert-einstein')

    let quoteCount = QUOTES.filter(quote => quote.author.slug === 'albert-einstein').length
    await expect(page.locator('#authors .title')).toHaveText('ALBERT EINSTEIN QUOTES')
    await expect(page).toHaveTitle('Albert Einstein Quotes | Quote Cloud')
    await expect(page.locator('.author-info h3')).toHaveText('Albert Einstein')
    await expect(page.locator('.author-info a')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Albert_Einstein')
    await expect(page.locator('.picture-quote')).toHaveCount(quoteCount)
    // the list tools are hidden here
    await expect(page.locator('#authorFilters')).toBeHidden()
  })

  test('a "javascript:" link from the API is never used', async ({ page }) => {
    await page.goto('author.html?slug=emile-zola')
    await expect(page.locator('.author-info a')).toHaveAttribute('href', '#')
  })

  test('an author that does not exist says so', async ({ page }) => {
    await page.goto('author.html?slug=nobody')
    await expect(page.locator('#authors .title')).toHaveText('AUTHOR NOT FOUND')
    await expect(page.getByRole('link', { name: 'See all authors' })).toHaveAttribute('href', 'author.html')
  })

  test('searching from an author page goes back to the list', async ({ page }) => {
    await page.goto('author.html?slug=albert-einstein')
    await page.getByRole('searchbox', { name: 'Search authors' }).fill('zola')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/author\.html\?name=zola$/)
    await expect(authorNames(page)).toHaveText(['Émile Zola'])
  })
})
