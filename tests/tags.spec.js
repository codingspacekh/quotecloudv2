// tag.html: the list of tags (js/pages/tags.js)
const { test, expect } = require('./helpers')

test.describe('tags page', () => {
  test('shows the tags with the most quotes first, without empty tags', async ({ page }) => {
    await page.goto('tag.html')

    await expect(page.locator('.tag-card')).toHaveText([
      /Life\s+45/,
      /Famous Quotes\s+20/,
      /Love\s+15/,
      /Danger\s+1/,
    ])
  })

  test('clicking a tag shows its quotes', async ({ page }) => {
    await page.goto('tag.html')

    await page.locator('.tag-card', { hasText: 'Love' }).click()

    await expect(page).toHaveURL(/quote\.html\?tag=Love$/)
    await expect(page.locator('#quotes .title')).toHaveText('LOVE QUOTES')
    await expect(page.locator('.picture-quote')).toHaveCount(15)
  })
})
