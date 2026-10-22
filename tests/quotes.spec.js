const { test, expect, card } = require('./helpers')

test.describe('quotes page', () => {
  test('shows 25 quotes with page buttons', async ({ page }) => {
    await page.goto('quote.html')

    await expect(page.locator('#quotes .title')).toHaveText('QUOTES')
    await expect(page.locator('.picture-quote')).toHaveCount(25)
    await expect(page.locator('.btn-group .btn-active')).toHaveText('1')
    await expect(page.locator('.btn-group .btn').last()).toHaveText('4')
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  test('page buttons and the arrow keys change the page', async ({ page }) => {
    await page.goto('quote.html')
    await expect(page.locator('.picture-quote')).toHaveCount(25)

    await page.locator('.btn-group').getByRole('button', { name: '2', exact: true }).click()
    await expect(page.locator('.btn-group .btn-active')).toHaveText('2')
    await expect(page.locator('blockquote').first()).toHaveText(/^Quote number 26:/)

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.btn-group .btn-active')).toHaveText('3')

    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.btn-group .btn-active')).toHaveText('2')
  })

  test('the search box on any page opens the results', async ({ page }) => {
    await page.goto('tag.html')

    await page.getByRole('searchbox', { name: 'Search quotes' }).fill('pineapple')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/quote\.html\?query=pineapple$/)
    await expect(page.locator('#quotes .title')).toHaveText('PINEAPPLE QUOTES')
    await expect(page).toHaveTitle('pineapple Quotes | Quote Cloud')
    await expect(page.locator('.picture-quote')).toHaveCount(1)
    await expect(page.getByRole('searchbox')).toHaveValue('pineapple')
  })

  test('an empty search stays on the page', async ({ page }) => {
    await page.goto('tag.html')
    await page.getByRole('searchbox').fill('   ')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/tag\.html$/)
  })

  test('a search with no results says so', async ({ page }) => {
    await page.goto('quote.html?query=zzzz')
    await expect(page.locator('.message')).toContainText('No quotes found')
    await expect(page.locator('.btn-group button')).toHaveCount(0)
  })

  test('tag links on a card show the quotes with that tag', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')

    await card(page, 'pineapple').getByRole('link', { name: 'Life' }).click()

    await expect(page).toHaveURL(/quote\.html\?tag=Life$/)
    await expect(page.locator('#quotes .title')).toHaveText('LIFE QUOTES')
  })

  test('the length filter is kept in the address and remembered next time', async ({ page }) => {
    await page.goto('quote.html')
    await expect(page.locator('.picture-quote')).toHaveCount(25)

    await page.selectOption('#lengthFilter', 'short')

    await expect(page).toHaveURL(/length=short/)
    await expect(page.locator('.btn-group .btn-active')).toHaveText('1')
    let lengths = await page.locator('blockquote').evaluateAll(quotes => quotes.map(q => q.textContent.length))
    expect(lengths.length).toBeGreaterThan(0)
    for (let length of lengths) {
      expect(length).toBeLessThanOrEqual(60)
    }

    await page.goto('quote.html')
    await expect(page.locator('#lengthFilter')).toHaveValue('short')
  })

  test('a made-up length in the address is ignored', async ({ page }) => {
    await page.goto('quote.html?length=huge')
    await expect(page.locator('#lengthFilter')).toHaveValue('all')
    await expect(page.locator('.picture-quote')).toHaveCount(25)
  })

  test('HTML inside a quote is shown as text and never runs', async ({ page }) => {
    await page.goto('quote.html?tag=Danger')

    const quote = page.locator('blockquote')
    await expect(quote).toHaveText('<img src=x onerror="window.hacked = true">Hello there')
    await expect(quote.locator('img')).toHaveCount(0)
    expect(await page.evaluate(() => window.hacked)).toBeUndefined()
  })

  test('broken names from the API are fixed', async ({ page }) => {
    await page.goto('quote.html?query=Quote%20number%202:')
    await expect(card(page, 'Quote number 2:').locator('cite')).toHaveText('Molière')
  })
})
