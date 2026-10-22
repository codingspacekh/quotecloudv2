// sw.js saves every file in APP_FILES for offline use.
// A file missing from the list doesn't work offline, a file in the list that
// doesn't exist stops the whole service worker from installing.
const fs = require('fs')
const path = require('path')
const { test, expect } = require('./helpers')

const ROOT = path.join(__dirname, '..')

// the files listed in APP_FILES in sw.js
const getListedFiles = () => {
  const code = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')
  const list = code.match(/const APP_FILES = \[([\s\S]*?)\]/)[1]
  return list.match(/'([^']+)'/g)
    .map(file => file.slice(1, -1))
    .filter(file => file !== './')
}

// every file in this folder (and below) that is part of the site
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
