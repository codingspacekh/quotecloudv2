const IMAGE_SIZES = {
  square: { label: 'Square', hint: 'Posts', width: 1080, height: 1080 },
  story: { label: 'Story', hint: 'Phone stories', width: 1080, height: 1920 },
  wide: { label: 'Wide', hint: 'X, slides', width: 1920, height: 1080 },
}

const TEXT_SIZES = {
  small: { label: 'Small', scale: 0.8 },
  medium: { label: 'Medium', scale: 1 },
  large: { label: 'Large', scale: 1.25 },
}

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const wallpaperCache = {}

const loadWallpaper = (index) => {
  if (!wallpaperCache[index]) {
    wallpaperCache[index] = loadImage(getWallpaper(index)).catch(() => {
      delete wallpaperCache[index]
      return null
    })
  }
  return wallpaperCache[index]
}

const loadFonts = async () => {
  try {
    await document.fonts.load('700 48px "Titillium Web"')
    await document.fonts.load('italic 600 40px "Titillium Web"')
  } catch (error) {
  }
}

const wrapText = (ctx, text, maxWidth) => {
  let words = text.split(' ')
  let lines = []
  let line = ''
  words.forEach(word => {
    let testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  })
  lines.push(line)
  return lines
}

const drawQuote = (canvas, quote, options) => {
  const { width, height } = IMAGE_SIZES[options.size]
  const scale = TEXT_SIZES[options.textSize].scale
  const wallpaper = options.wallpaper

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (wallpaper) {
    let zoom = Math.max(width / wallpaper.width, height / wallpaper.height)
    let picWidth = wallpaper.width * zoom
    let picHeight = wallpaper.height * zoom
    ctx.drawImage(wallpaper, (width - picWidth) / 2, (height - picHeight) / 2, picWidth, picHeight)
  } else {
    ctx.fillStyle = '#182747'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(0, 0, width, height)

  let padding = width * 0.1
  let fontSize = Math.round(68 * scale)
  let lines = []
  do {
    fontSize -= 4
    ctx.font = `700 ${fontSize}px "Titillium Web", sans-serif`
    lines = wrapText(ctx, `“${quote.content}”`, width - padding * 2)
  } while (lines.length * fontSize * 1.35 > height - 380 && fontSize > 28)

  let lineHeight = fontSize * 1.35
  let textHeight = lines.length * lineHeight
  let y = (height - textHeight) / 2 - 30

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#03C988'
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 6
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, y + i * lineHeight)
  })

  let authorSize = Math.round(40 * scale)
  ctx.font = `italic 600 ${authorSize}px "Titillium Web", sans-serif`
  ctx.fillText(`— ${quote.author.name}`, width / 2, y + textHeight + authorSize)

  ctx.shadowBlur = 0
  ctx.font = `700 28px "Titillium Web", sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText('QUOTE CLOUD', width / 2, height - 80)
}

const canvasToBlob = (canvas) => {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Empty image')), 'image/png')
    } catch (error) {
      reject(error)
    }
  })
}

const downloadQuoteImage = async (quote, options) => {
  await loadFonts()
  const canvas = document.createElement('canvas')
  drawQuote(canvas, quote, options)

  let withPicture = true
  let blob
  try {
    blob = await canvasToBlob(canvas)
  } catch (error) {
    drawQuote(canvas, quote, { ...options, wallpaper: null })
    blob = await canvasToBlob(canvas)
    withPicture = false
  }

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `quote-${quote.author.slug || 'my-quote'}-${options.size}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  return withPicture
}
