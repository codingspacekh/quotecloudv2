const fs = require('fs')
const path = require('path')
const { test, expect } = require('./helpers')

const ROOT = path.join(__dirname, '..')

const getQuotedNames = (text) => (text.match(/'([^']+)'/g) || []).map(name => name.slice(1, -1))

const getWallpaperList = () => getQuotedNames(fs.readFileSync(path.join(ROOT, 'js/shared/wallpapers.js'), 'utf8'))

const getListedFiles = () => {
  const code = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')
  const list = code.match(/const APP_FILES = \[([\s\S]*?)\]/)[1]
  let files = getQuotedNames(list).filter(file => file !== './')
  if (list.includes('...WALLPAPERS')) files.push(...getWallpaperList())
  return files
}

const getSiteFiles = (folder = '') => {
  let files = []
  for (const entry of fs.readdirSync(path.join(ROOT, folder), { withFileTypes: true })) {
    let file = folder ? `${folder}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (['css', 'js', 'assets'].includes(file.split('/')[0])) files.push(...getSiteFiles(file))
    } else if (folder || file.endsWith('.html')) {
      if (entry.name !== '.DS_Store') files.push(file)
    }
  }
  return files
}

test.describe('service worker file list', () => {
  test('every file in APP_FILES exists', () => {
    for (const file of getListedFiles()) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} is in sw.js but doesn't exist`).toBe(true)
    }
  })

  test('every page, style, script and picture is in APP_FILES', () => {
    expect(getListedFiles().sort()).toEqual(getSiteFiles().sort())
  })
})

test.describe('wallpaper list', () => {
  test('js/shared/wallpapers.js lists every picture in the wallpapers folder', () => {
    let pictures = getSiteFiles().filter(file => file.startsWith('assets/images/wallpapers/'))
    expect(getWallpaperList().sort(), 'the wallpapers folder changed: run "npm run wallpapers"').toEqual(pictures.sort())
  })

  test('the download window offers every wallpaper', async ({ page }) => {
    await page.goto('index.html')
    await page.locator('.today-quote-wrapper [data-action="download"]').click()
    await expect(page.locator('.image-dialog input[name="background"]')).toHaveCount(getWallpaperList().length + 1)
  })
})
