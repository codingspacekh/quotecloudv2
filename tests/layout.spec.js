const { test, expect, toast } = require('./helpers')
const { API, reply } = require('./fake-api')

const PAGES = [
  { file: 'index.html', menu: 'HOME' },
  { file: 'quote.html', menu: 'QUOTES' },
  { file: 'tag.html', menu: 'TAGS' },
  { file: 'author.html', menu: 'AUTHORS' },
  { file: 'favorites.html', menu: 'My favorites' },
  { file: 'my-quotes.html', menu: 'My quotes' },
]

const theme = (page) => page.locator('html')

test.describe('every page', () => {
  for (const { file, menu } of PAGES) {
    test(`${file} loads and marks "${menu}" in the menu`, async ({ page }) => {
      await page.goto(file)

      await expect(page.locator('.picture-quote:not(.skeleton), .tag-card:not(.skeleton), .author-card:not(.skeleton), .message').first()).toBeVisible()
      await expect(page.locator('nav a[aria-current="page"]')).toHaveAccessibleName(menu)
      await expect(page.locator('footer .year')).toHaveText(String(new Date().getFullYear()))
    })
  }
})

test.describe('theme', () => {
  test('starts with the computer\'s setting', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('tag.html')
    await expect(theme(page)).toHaveAttribute('data-theme', 'dark')
  })

  test('the theme button switches it, and it is remembered', async ({ page }) => {
    await page.goto('tag.html')
    await expect(theme(page)).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('.theme-toggle')).toHaveAccessibleName('Switch to dark theme')

    await page.click('.theme-toggle')
    await expect(theme(page)).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.theme-toggle')).toHaveAccessibleName('Switch to light theme')

    await page.goto('index.html')
    await expect(theme(page)).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('keyboard shortcuts', () => {
  test('? shows the list, Escape closes it', async ({ page }) => {
    await page.goto('tag.html')

    await page.keyboard.press('?')
    await expect(page.locator('.shortcuts-dialog')).toBeVisible()
    await expect(page.locator('.shortcuts-dialog')).toContainText('Random quote')

    await page.keyboard.press('Escape')
    await expect(page.locator('.shortcuts-dialog')).toBeHidden()
  })

  test('/ jumps to the search box, Escape leaves it', async ({ page }) => {
    await page.goto('tag.html')
    const search = page.getByRole('searchbox', { name: 'Search quotes' })

    await page.keyboard.press('/')
    await expect(search).toBeFocused()

    await page.keyboard.type('trust')
    await expect(search).toHaveValue('trust')
    await expect(theme(page)).toHaveAttribute('data-theme', 'light')

    await page.keyboard.press('Escape')
    await expect(search).not.toBeFocused()
  })

  test('T switches the theme', async ({ page }) => {
    await page.goto('tag.html')
    await page.keyboard.press('t')
    await expect(theme(page)).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('back to top', () => {
  test('shows after scrolling down, and goes back to the top', async ({ page }) => {
    await page.goto('quote.html')
    await expect(page.locator('.picture-quote')).toHaveCount(25)
    const button = page.locator('.back-to-top')
    await expect(button).not.toHaveClass(/show/)

    await page.evaluate(() => window.scrollTo(0, 3000))
    await expect(button).toHaveClass(/show/)

    await button.click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(page.locator('header a').first()).toBeFocused()
  })
})

test.describe('offline', () => {
  test('the bar shows when the internet goes away, and "Back online" when it returns', async ({ page, context }) => {
    await page.goto('tag.html')
    const banner = page.locator('.offline-banner')
    await expect(banner).not.toHaveClass(/show/)

    await context.setOffline(true)
    await expect(banner).toHaveClass(/show/)

    await context.setOffline(false)
    await expect(banner).not.toHaveClass(/show/)
    await expect(toast(page)).toHaveText('Back online')
  })

  test('the bar shows when the quotes are a saved copy from sw.js', async ({ page }) => {
    await page.route(API, route => {
      return reply(route, [{ id: 'Life', name: 'Life', quotesCount: 1 }], 200, { 'X-Saved-Copy': 'true' })
    })
    await page.goto('tag.html')

    await expect(page.locator('.tag-card')).toHaveCount(1)
    await expect(page.locator('.offline-banner')).toHaveClass(/show/)
  })
})
