const { test, expect, card, toast } = require('./helpers')
const { getQuote } = require('./fake-api')

const imageDialog = (page) => page.locator('.image-dialog')

const previewSize = (page) => page.evaluate(() => {
  const canvas = document.querySelector('.image-dialog canvas')
  return `${canvas.width}x${canvas.height}`
})

test.describe('card buttons', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('copy puts “the quote” — Author on the clipboard', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')

    await card(page, 'pineapple').getByRole('button', { name: 'Copy quote' }).click()

    await expect(toast(page)).toHaveText('Quote copied!')
    let copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe(`“${getQuote('q42').content}” — Molière`)
  })

  test('download: pick a size, see the preview, get a PNG', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')

    await card(page, 'pineapple').getByRole('button', { name: 'Download as image' }).click()
    await expect(imageDialog(page)).toBeVisible()
    await expect.poll(() => previewSize(page)).toBe('1080x1080')

    await imageDialog(page).locator('label', { hasText: 'Story' }).click()
    await expect.poll(() => previewSize(page)).toBe('1080x1920')

    const download = page.waitForEvent('download')
    await imageDialog(page).getByRole('button', { name: 'Download' }).click()
    expect((await download).suggestedFilename()).toBe('quote-moliere-story.png')
    await expect(toast(page)).toHaveText('Image downloaded')
    await expect(imageDialog(page)).toBeHidden()

    await card(page, 'pineapple').getByRole('button', { name: 'Download as image' }).click()
    await expect(imageDialog(page).locator('input[name="size"]:checked')).toHaveValue('story')
  })

  test('download: Cancel closes the window', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')

    await card(page, 'pineapple').getByRole('button', { name: 'Download as image' }).click()
    await imageDialog(page).getByRole('button', { name: 'Cancel' }).click()

    await expect(imageDialog(page)).toBeHidden()
  })
})

test.describe('share on Facebook', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test.beforeEach(async ({ context }) => {
    await context.route('**/www.facebook.com/**', route => route.fulfill({ contentType: 'text/html', body: 'Facebook' }))
  })

  const shareOnFacebook = async (page, text) => {
    const popup = page.waitForEvent('popup')
    await card(page, text).getByRole('button', { name: 'Share on Facebook' }).click()
    const sharer = new URL((await popup).url())
    return { sharer, shared: new URL(sharer.searchParams.get('u')) }
  }

  test('copies the quote and opens Facebook with a link to the author', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')

    const { sharer, shared } = await shareOnFacebook(page, 'pineapple')

    expect(sharer.origin + sharer.pathname).toBe('https://www.facebook.com/sharer/sharer.php')
    expect(shared.pathname).toBe('/author.html')
    expect(shared.searchParams.get('slug')).toBe('moliere')
    await expect(toast(page)).toHaveText('Quote copied, paste it into your Facebook post')
    let copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe(`“${getQuote('q42').content}” — Molière`)
  })

  test('a quote you wrote links to the home page', async ({ page }) => {
    await page.goto('my-quotes.html')
    await page.fill('#quoteText', 'Be kind whenever possible.')
    await page.getByRole('button', { name: 'Add quote' }).click()

    const { shared } = await shareOnFacebook(page, 'Be kind')

    expect(shared.pathname).toBe('/index.html')
  })
})
