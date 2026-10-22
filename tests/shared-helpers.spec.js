// Small functions from js/shared/, tested straight inside the page
// (the files are plain <script>s, so their functions are on window)
const { test, expect } = require('./helpers')
const { BROKEN_MOLIERE } = require('./fake-api')

test.describe('shared helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('tag.html')
  })

  test('fixText repairs broken names and leaves good text alone', async ({ page }) => {
    let results = await page.evaluate((broken) => {
      return [fixText(broken), fixText('René'), fixText('Albert Einstein'), fixText('東京')]
    }, BROKEN_MOLIERE)

    expect(results).toEqual(['Molière', 'René', 'Albert Einstein', '東京'])
  })

  test('fixData fixes every string inside an API answer', async ({ page }) => {
    let fixed = await page.evaluate((broken) => {
      return fixData({ data: [{ author: { name: broken }, count: 3, tags: [broken] }] })
    }, BROKEN_MOLIERE)

    expect(fixed).toEqual({ data: [{ author: { name: 'Molière' }, count: 3, tags: ['Molière'] }] })
  })

  test('escapeHTML turns HTML into plain text', async ({ page }) => {
    let escaped = await page.evaluate(() => escapeHTML(`<a href="x">it's & more</a>`))
    expect(escaped).toBe('&lt;a href=&quot;x&quot;&gt;it&#39;s &amp; more&lt;/a&gt;')
  })

  test('safeURL only allows http and https links', async ({ page }) => {
    let urls = await page.evaluate(() => {
      return [safeURL('https://example.com/a'), safeURL('http://example.com/'), safeURL('javascript:alert(1)'), safeURL('not a link')]
    })
    expect(urls).toEqual(['https://example.com/a', 'http://example.com/', '#', '#'])
  })

  test('formatQuote makes “the quote” — Author', async ({ page }) => {
    let text = await page.evaluate(() => formatQuote({ content: 'Hi', author: { name: 'Me' } }))
    expect(text).toBe('“Hi” — Me')
  })

  test('createPageButtons: ← 1 … 4 5 [6] 7 8 … 21 →', async ({ page }) => {
    // returns the text of each button, and which ones are active or disabled
    const buttonsFor = (pageIndex, lastPage) => page.evaluate(([pageIndex, lastPage]) => {
      let box = document.createElement('div')
      box.innerHTML = createPageButtons(pageIndex, lastPage)
      return [...box.children].map(el => {
        if (el.disabled) return `(${el.textContent})`
        if (el.classList.contains('btn-active')) return `[${el.textContent}]`
        return el.textContent
      })
    }, [pageIndex, lastPage])

    expect(await buttonsFor(5, 20)).toEqual(['←', '1', '…', '4', '5', '[6]', '7', '8', '…', '21', '→'])
    expect(await buttonsFor(0, 3)).toEqual(['(←)', '[1]', '2', '3', '4', '→'])
    expect(await buttonsFor(3, 3)).toEqual(['←', '1', '2', '3', '[4]', '(→)'])
    // one page only: no buttons at all
    expect(await buttonsFor(0, 0)).toEqual([])
  })

  test('settings survive when localStorage is blocked', async ({ page }) => {
    let results = await page.evaluate(() => {
      // pretend the browser blocks localStorage, like some private windows
      Storage.prototype.getItem = () => { throw new Error('blocked') }
      Storage.prototype.setItem = () => { throw new Error('blocked') }
      return [loadSetting('theme', 'dark'), loadJSON('myQuotes', []), saveJSON('myQuotes', [1])]
    })
    expect(results).toEqual(['dark', [], false])
  })
})
