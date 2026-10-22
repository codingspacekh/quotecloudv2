const { test, expect, card, toast, confirmDialog } = require('./helpers')

const addQuote = async (page, text, author = '') => {
  await page.fill('#quoteText', text)
  await page.fill('#quoteAuthor', author)
  await page.getByRole('button', { name: 'Add quote' }).click()
  await expect(card(page, text)).toHaveCount(1)
}

test.describe('my quotes', () => {
  test('with no quotes yet, the page says what to do', async ({ page }) => {
    await page.goto('my-quotes.html')
    await expect(page.locator('.message')).toContainText('You have not written any quotes yet')
  })

  test('the form explains what is wrong', async ({ page }) => {
    await page.goto('my-quotes.html')
    const submit = page.getByRole('button', { name: 'Add quote' })

    await submit.click()
    await expect(page.locator('#quoteTextError')).toHaveText('Please write a quote.')
    await expect(page.locator('#quoteText')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#quoteText')).toBeFocused()

    await page.fill('#quoteText', 'Short')
    await expect(page.locator('#quoteTextError')).toHaveText('')
    await expect(page.locator('#quoteTextCount')).toHaveText('5 / 300')
    await submit.click()
    await expect(page.locator('#quoteTextError')).toHaveText('Write at least 10 letters (you have 5).')

    await page.fill('#quoteText', 'A long enough quote')
    await page.fill('#quoteAuthor', '1234')
    await submit.click()
    await expect(page.locator('#quoteAuthorError')).toHaveText('A name needs at least one letter.')
    await expect(page.locator('#quoteAuthor')).toBeFocused()
  })

  test('the same quote can not be added twice', async ({ page }) => {
    await page.goto('my-quotes.html')
    await addQuote(page, 'Be kind whenever possible.')

    await page.fill('#quoteText', '  BE KIND   whenever possible. ')
    await page.getByRole('button', { name: 'Add quote' }).click()

    await expect(page.locator('#quoteTextError')).toHaveText('You already wrote this quote.')
  })

  test('add a quote: it is shown, saved, and has no heart', async ({ page }) => {
    await page.goto('my-quotes.html')

    await addQuote(page, 'Be kind whenever possible.')
    await addQuote(page, 'Small steps every day.', 'Grandma')

    await expect(toast(page)).toHaveText('Quote added')
    await expect(page.locator('#my-quotes .title')).toHaveText('MY QUOTES (2)')
    await expect(page.locator('blockquote')).toHaveText(['Small steps every day.', 'Be kind whenever possible.'])
    await expect(card(page, 'Be kind').locator('cite')).toHaveText('Anonymous')
    await expect(card(page, 'Small steps').locator('cite')).toHaveText('Grandma')
    await expect(page.locator('[data-action="favorite"]')).toHaveCount(0)
    await expect(page.locator('#quoteText')).toHaveValue('')

    await page.reload()
    await expect(page.locator('.picture-quote')).toHaveCount(2)
  })

  test('edit a quote', async ({ page }) => {
    await page.goto('my-quotes.html')
    await addQuote(page, 'Be kind whenever possible.')

    await card(page, 'Be kind').getByRole('button', { name: 'Edit quote' }).click()
    await expect(page.locator('.form-title')).toHaveText('Edit your quote')
    await expect(page.locator('#quoteText')).toHaveValue('Be kind whenever possible.')
    await expect(page.locator('#quoteText')).toBeFocused()
    await expect(card(page, 'Be kind')).toHaveClass(/is-editing/)

    await page.fill('#quoteText', 'Be kind, always.')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(toast(page)).toHaveText('Quote updated')
    await expect(page.locator('blockquote')).toHaveText(['Be kind, always.'])
    await expect(page.locator('.form-title')).toHaveText('Write your own quote')
  })

  test('Cancel stops editing and changes nothing', async ({ page }) => {
    await page.goto('my-quotes.html')
    await addQuote(page, 'Be kind whenever possible.')

    await card(page, 'Be kind').getByRole('button', { name: 'Edit quote' }).click()
    await page.fill('#quoteText', 'Something else entirely')
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('blockquote')).toHaveText(['Be kind whenever possible.'])
    await expect(page.locator('.form-title')).toHaveText('Write your own quote')
    await expect(card(page, 'Be kind').getByRole('button', { name: 'Edit quote' })).toBeFocused()
  })

  test('delete asks first, then moves the keyboard to the next card, or the form', async ({ page }) => {
    await page.goto('my-quotes.html')
    await addQuote(page, 'First quote of mine.')
    await addQuote(page, 'Second quote of mine.')

    await card(page, 'Second').getByRole('button', { name: 'Delete quote' }).click()
    await expect(confirmDialog(page)).toContainText('Second quote of mine.')
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(toast(page)).toHaveText('Quote deleted')
    await expect(card(page, 'First').getByRole('button', { name: 'Delete quote' })).toBeFocused()

    await card(page, 'First').getByRole('button', { name: 'Delete quote' }).click()
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.message')).toContainText('You have not written any quotes yet')
    await expect(page.locator('#quoteText')).toBeFocused()
  })

  test('Escape on the "delete?" window keeps the quote', async ({ page }) => {
    await page.goto('my-quotes.html')
    await addQuote(page, 'First quote of mine.')

    await card(page, 'First').getByRole('button', { name: 'Delete quote' }).click()
    await page.keyboard.press('Escape')

    await expect(page.locator('.picture-quote')).toHaveCount(1)
  })
})
