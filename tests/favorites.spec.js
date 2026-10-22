const { test, expect, saveInBrowser, favorite, card, toast, confirmDialog } = require('./helpers')
const { getQuote } = require('./fake-api')

const heart = (cardLocator) => cardLocator.locator('[data-action="favorite"]')
const collectionBar = (page) => page.locator('.collection-bar')

const saveThreeFavorites = (page, extra = {}) => saveInBrowser(page, {
  favoriteQuotes: [favorite(getQuote('q1')), favorite(getQuote('q2')), favorite(getQuote('q42'))],
  ...extra,
})

test.describe('saving favorites', () => {
  test('with nothing saved, the page says what to do', async ({ page }) => {
    await page.goto('favorites.html')
    await expect(page.locator('.message')).toContainText('You have no favorite quotes yet')
    await expect(page.locator('#favorites .title')).toHaveText('MY FAVORITES')
  })

  test('the heart saves a quote, and it shows on the favorites page', async ({ page }) => {
    await page.goto('quote.html?query=pineapple')
    const pineapple = card(page, 'pineapple')

    await heart(pineapple).click()
    await expect(heart(pineapple)).toHaveAttribute('aria-pressed', 'true')
    await expect(toast(page)).toHaveText('Saved to favorites')

    await page.goto('favorites.html')
    await expect(page.locator('#favorites .title')).toHaveText('MY FAVORITES (1)')
    await expect(page.locator('.picture-quote')).toHaveCount(1)
    await expect(heart(pineapple)).toHaveAttribute('aria-pressed', 'true')
  })

  test('the heart removes a plain favorite without asking (outside the favorites page)', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('quote.html?query=pineapple')

    await heart(card(page, 'pineapple')).click()

    await expect(confirmDialog(page)).toHaveCount(0)
    await expect(toast(page)).toHaveText('Removed from favorites')
    await expect(heart(card(page, 'pineapple'))).toHaveAttribute('aria-pressed', 'false')
  })

  test('removing a favorite with a note asks first', async ({ page }) => {
    await saveInBrowser(page, { favoriteQuotes: [favorite(getQuote('q42'), { note: 'So true' })] })
    await page.goto('quote.html?query=pineapple')

    await heart(card(page, 'pineapple')).click()
    await expect(confirmDialog(page)).toContainText('Your note and collections for this quote will be deleted too.')

    await confirmDialog(page).getByRole('button', { name: 'Remove' }).click()
    await expect(toast(page)).toHaveText('Removed from favorites')
  })
})

test.describe('favorites page', () => {
  test('asks before removing, Cancel keeps the quote', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html')

    await heart(card(page, 'Quote number 2:')).click()
    await expect(confirmDialog(page)).toContainText('Remove from favorites?')
    await expect(confirmDialog(page).getByRole('button', { name: 'Cancel' })).toBeFocused()

    await confirmDialog(page).getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('.picture-quote')).toHaveCount(3)
  })

  test('removing a quote takes its card away and moves the keyboard to the next heart', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html')

    await heart(card(page, 'Quote number 2:')).click()
    await confirmDialog(page).getByRole('button', { name: 'Remove' }).click()

    await expect(page.locator('.picture-quote')).toHaveCount(2)
    await expect(page.locator('#favorites .title')).toHaveText('MY FAVORITES (2)')
    await expect(heart(card(page, 'pineapple'))).toBeFocused()
  })

  test('removing the last favorite shows the empty message', async ({ page }) => {
    await saveInBrowser(page, { favoriteQuotes: [favorite(getQuote('q1'))] })
    await page.goto('favorites.html')

    await heart(card(page, 'Quote number 1:')).click()
    await confirmDialog(page).getByRole('button', { name: 'Remove' }).click()

    await expect(page.locator('.message')).toContainText('You have no favorite quotes yet')
  })
})

test.describe('notes', () => {
  test('add, change and delete a note', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html')
    const pineapple = card(page, 'pineapple')
    const noteDialog = page.locator('#noteDialog')

    await pineapple.getByRole('button', { name: 'Add a note' }).click()
    await expect(noteDialog).toContainText('pineapple')
    await expect(page.locator('#noteText')).toBeFocused()
    await page.fill('#noteText', 'Makes me smile')
    await expect(page.locator('#noteCount')).toHaveText('14 / 200')
    await noteDialog.getByRole('button', { name: 'Save', exact: true }).click()

    await expect(pineapple.locator('.quote-note')).toContainText('Makes me smile')
    await expect(toast(page)).toHaveText('Note saved')
    await expect(pineapple.getByRole('button', { name: 'Edit your note' })).toBeFocused()

    await page.reload()
    await expect(pineapple.locator('.quote-note')).toContainText('Makes me smile')

    await pineapple.getByRole('button', { name: 'Edit your note' }).click()
    await expect(page.locator('#noteText')).toHaveValue('Makes me smile')
    await noteDialog.getByRole('button', { name: 'Delete note' }).click()

    await expect(pineapple.locator('.quote-note')).toHaveCount(0)
    await expect(toast(page)).toHaveText('Note deleted')
  })

  test('Cancel keeps the note as it was', async ({ page }) => {
    await saveInBrowser(page, { favoriteQuotes: [favorite(getQuote('q42'), { note: 'Old note' })] })
    await page.goto('favorites.html')

    await page.getByRole('button', { name: 'Edit your note' }).click()
    await page.fill('#noteText', 'New note')
    await page.locator('#noteDialog').getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.quote-note')).toContainText('Old note')
  })
})

test.describe('collections', () => {
  test('make a collection from a card and see the quote in it', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html')
    const pineapple = card(page, 'pineapple')
    const dialog = page.locator('#collectionsDialog')

    await pineapple.getByRole('button', { name: 'Add to a collection' }).click()
    await expect(dialog).toContainText('You have no collections yet')

    await page.fill('#newCollectionName', 'Motivation')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(dialog.getByRole('checkbox', { name: 'Motivation' })).toBeChecked()
    await expect(toast(page)).toHaveText('Added to "Motivation"')

    await page.fill('#newCollectionName', 'MOTIVATION')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.locator('#newCollectionError')).toHaveText('You already have a collection with this name.')
    await expect(page.locator('#newCollectionName')).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByRole('button', { name: 'Done' }).click()
    await expect(pineapple.locator('.collection-chip')).toHaveText('Motivation')
    await expect(pineapple.getByRole('button', { name: 'Add to a collection' })).toBeFocused()

    await collectionBar(page).getByRole('button', { name: /Motivation/ }).click()
    await expect(page).toHaveURL(/collection=c-/)
    await expect(page.locator('.picture-quote')).toHaveCount(1)
    await page.reload()
    await expect(page.locator('.picture-quote')).toHaveCount(1)
    await expect(collectionBar(page).getByRole('button', { name: /Motivation/ })).toHaveAttribute('aria-pressed', 'true')
  })

  const saveWithCollection = (page) => saveInBrowser(page, {
    favoriteQuotes: [favorite(getQuote('q1')), favorite(getQuote('q42'), { collections: ['c-1'] })],
    quoteCollections: [{ id: 'c-1', name: 'Motivation' }],
  })

  test('taking the last quote out of the collection shows the empty message', async ({ page }) => {
    await saveWithCollection(page)
    await page.goto('favorites.html?collection=c-1')

    await card(page, 'pineapple').getByRole('button', { name: 'Add to a collection' }).click()
    await page.locator('#collectionsDialog').getByRole('checkbox', { name: 'Motivation' }).uncheck()
    await page.locator('#collectionsDialog').getByRole('button', { name: 'Done' }).click()

    await expect(page.locator('.message')).toContainText('This collection is empty')
    await expect(collectionBar(page).locator('.btn-active')).toBeFocused()
  })

  test('rename a collection', async ({ page }) => {
    await saveWithCollection(page)
    await page.goto('favorites.html?collection=c-1')

    await page.getByRole('button', { name: 'Rename' }).click()
    await page.fill('#collectionName', '')
    await page.locator('#collectionNameDialog').getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('#collectionNameError')).toHaveText('Give the collection a name.')

    await page.fill('#collectionName', 'Daily push')
    await page.locator('#collectionNameDialog').getByRole('button', { name: 'Save' }).click()

    await expect(collectionBar(page).locator('.btn-active')).toContainText('Daily push')
    await expect(toast(page)).toHaveText('Collection renamed')
  })

  test('delete a collection, its quotes stay in favorites', async ({ page }) => {
    await saveWithCollection(page)
    await page.goto('favorites.html?collection=c-1')

    await page.getByRole('button', { name: 'Delete collection' }).click()
    await expect(confirmDialog(page)).toContainText('Delete "Motivation"?')
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(collectionBar(page).getByRole('button', { name: /Motivation/ })).toHaveCount(0)
    await expect(collectionBar(page).locator('.btn-active')).toBeFocused()
    await expect(page.locator('.picture-quote')).toHaveCount(2)
    await expect(page).not.toHaveURL(/collection=/)
  })

  test('"New collection" makes an empty collection and shows it', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html')

    await page.getByRole('button', { name: 'New collection' }).click()
    await page.fill('#collectionName', 'For exams')
    await page.locator('#collectionNameDialog').getByRole('button', { name: 'Save' }).click()

    await expect(collectionBar(page).locator('.btn-active')).toContainText('For exams')
    await expect(page.locator('.message')).toContainText('This collection is empty')
  })

  test('a collection in the address that does not exist shows all favorites', async ({ page }) => {
    await saveThreeFavorites(page)
    await page.goto('favorites.html?collection=c-gone')

    await expect(page.locator('.picture-quote')).toHaveCount(3)
    await expect(page).not.toHaveURL(/collection=/)
  })
})
