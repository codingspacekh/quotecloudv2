const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FOLDER = 'assets/images/wallpapers'
const LIST_FILE = 'js/shared/wallpapers.js'
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp']
const SAFE_NAME = /^[A-Za-z0-9._-]+$/
const BIG_FILE = 500 * 1024

const naturalOrder = (a, b) => a.localeCompare(b, undefined, { numeric: true })

const getPictures = () => {
  return fs.readdirSync(path.join(ROOT, FOLDER))
    .filter(name => IMAGE_TYPES.includes(path.extname(name).toLowerCase()))
}

const getSavedList = () => {
  try {
    const code = fs.readFileSync(path.join(ROOT, LIST_FILE), 'utf8')
    return (code.match(/'([^']+)'/g) || []).map(file => file.slice(1, -1))
  } catch (error) {
    return []
  }
}

const updateWallpapers = () => {
  let names = getPictures()
  let badNames = names.filter(name => !SAFE_NAME.test(name))
  let files = names.filter(name => SAFE_NAME.test(name)).map(name => `${FOLDER}/${name}`)

  let kept = getSavedList().filter(file => files.includes(file))
  let added = files.filter(file => !kept.includes(file)).sort(naturalOrder)
  let list = [...kept, ...added]

  if (list.length === 0) {
    console.error(`No pictures found in ${FOLDER}`)
    process.exit(1)
  }

  let code = `const WALLPAPERS = [\n${list.map(file => `  '${file}',`).join('\n')}\n]\n`
  fs.writeFileSync(path.join(ROOT, LIST_FILE), code)
  console.log(`${list.length} wallpapers saved in ${LIST_FILE} (${added.length} new)`)

  for (let name of badNames) {
    console.warn(`Skipped "${name}": use only letters, numbers, - _ and . in the name, e.g. beach-sunset.jpg`)
  }
  for (let file of list) {
    let size = fs.statSync(path.join(ROOT, file)).size
    if (size > BIG_FILE) {
      console.warn(`${file} is ${(size / 1024 / 1024).toFixed(1)} MB, a smaller picture (about 1920 px wide) loads faster`)
    }
  }
}

updateWallpapers()
