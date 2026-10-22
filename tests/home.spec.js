// index.html: quote of the day, random quote, famous quotes (js/pages/home.js)
const { test, expect } = require('./helpers')
const { API, reply } = require('./fake-api')

test.describe('home page', () => {
  test('shows the quote of the day and 6 famous quotes', async ({ page }) => {
    await page.goto('index.html')

    await expect(page.locator('#today-quote .title')).toHaveText('QUOTE OF THE DAY')
    await expect(page.locator('.today-quote-wrapper .picture-quote')).toHaveCount(1)
    await expect(page.locator('#famous-quote .picture-quote')).toHaveCount(6)
    await expect(page.locator('#famous-quote blockquote').first()).toContainText('Famous words')
  })

  test('everyone gets the same quote all day, and a new one the next day', async ({ page }) => {
    const todayQuote = page.locator('.today-quote-wrapper blockquote')

    await page.clock.setFixedTime(new Date('2026-10-22T09:00:00'))
    await page.goto('index.html')
    let morningQuote = await todayQuote.textContent()

    await page.clock.setFixedTime(new Date('2026-10-22T21:00:00'))
    await page.reload()
    await expect(todayQuote).toHaveText(morningQuote)

    await page.clock.setFixedTime(new Date('2026-10-23T09:00:00'))
    await page.reload()
    await expect(todayQuote).not.toHaveText(morningQuote)
  })

  test('"Get Another Quote" shows a random quote', async ({ page }) => {
    await page.goto('index.html')
    await expect(page.locator('.today-quote-wrapper .picture-quote')).toHaveCount(1)

    await page.click('#randomQuoteBtn')

    await expect(page.locator('#today-quote .title')).toHaveText('RANDOM QUOTE')
    await expect(page.locator('.today-quote-wrapper .picture-quote')).toHaveCount(1)
    await expect(page.locator('#randomQuoteBtn')).toBeEnabled()
  })

  test('the R key also shows a random quote', async ({ page }) => {
    await page.goto('index.html')
    await expect(page.locator('#randomQuoteBtn')).toBeEnabled()

    await page.keyboard.press('r')

    await expect(page.locator('#today-quote .title')).toHaveText('RANDOM QUOTE')
  })

  test('shows an error with "Try again" when the API fails, and loads again', async ({ page }) => {
    // the API answers with errors until the test fixes it
    let broken = true
    await page.route(API, route => broken ? reply(route, {}, 500) : route.fallback())
    await page.goto('index.html')

    const error = page.locator('.today-quote-wrapper .error-message')
    await expect(error).toContainText('Could not load the quote of the day.')
    await expect(error).toContainText('The quotes service is having problems right now.')
    await expect(page.locator('#famous-quote .error-message')).toContainText('Could not load famous quotes.')

    broken = false
    await error.getByRole('button', { name: 'Try again' }).click()

    await expect(page.locator('.today-quote-wrapper .picture-quote')).toHaveCount(1)
  })
})
