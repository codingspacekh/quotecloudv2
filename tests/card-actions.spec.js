// The copy and "download as image" buttons on every card
// (js/shared/quote-card.js, js/shared/image-dialog.js, js/shared/quote-image.js)
const { test, expect, card, toast } = require('./helpers')
const { getQuote } = require('./fake-api')

const imageDialog = (page) => page.locator('.image-dialog')

// the size of the preview picture, once it is drawn
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

    // the size chosen last time is used again
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
