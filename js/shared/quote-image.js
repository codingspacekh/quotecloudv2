// "Download as image": draws a quote on a <canvas> and saves it as a PNG

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// splits the text into lines that fit inside maxWidth
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

const drawQuote = (ctx, size, quote, wallpaper) => {
  // background: the wallpaper cropped to a square, or a plain color
  if (wallpaper) {
    let scale = Math.max(size / wallpaper.width, size / wallpaper.height)
    let width = wallpaper.width * scale
    let height = wallpaper.height * scale
    ctx.drawImage(wallpaper, (size - width) / 2, (size - height) / 2, width, height)
  } else {
    ctx.fillStyle = '#182747'
    ctx.fillRect(0, 0, size, size)
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(0, 0, size, size)

  // make the font smaller until the quote fits
  let padding = 110
  let fontSize = 68
  let lines = []
  do {
    fontSize -= 4
    ctx.font = `700 ${fontSize}px "Titillium Web", sans-serif`
    lines = wrapText(ctx, `“${quote.content}”`, size - padding * 2)
  } while (lines.length * fontSize * 1.35 > size - 380 && fontSize > 28)

  let lineHeight = fontSize * 1.35
  let textHeight = lines.length * lineHeight
  let y = (size - textHeight) / 2 - 30

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#03C988'
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 6
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, y + i * lineHeight)
  })

  ctx.font = `italic 600 40px "Titillium Web", sans-serif`
  ctx.fillText(`— ${quote.author.name}`, size / 2, y + textHeight + 40)

  ctx.shadowBlur = 0
  ctx.font = `700 28px "Titillium Web", sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText('QUOTE CLOUD', size / 2, size - 80)
}

const canvasToBlob = (canvas) => {
  return new Promise((resolve, reject) => {
    // throws if the wallpaper "taints" the canvas (when the page is opened as file://)
    try {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Empty image')), 'image/png')
    } catch (error) {
      reject(error)
    }
  })
}

const downloadQuoteImage = async (quote, wallpaperIndex) => {
  const size = 1080
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // wait for the web font, otherwise the canvas uses a default font
  try {
    await document.fonts.load('700 48px "Titillium Web"')
    await document.fonts.load('italic 600 40px "Titillium Web"')
  } catch (error) {
    // the default font is fine too
  }

  let wallpaper = null
  try {
    wallpaper = await loadImage(getWallpaper(wallpaperIndex))
  } catch (error) {
    // no picture, drawQuote uses a plain background
  }

  drawQuote(ctx, size, quote, wallpaper)
  let blob
  try {
    blob = await canvasToBlob(canvas)
  } catch (error) {
    // browsers block reading pictures from file:// pages, so draw it again without the picture
    drawQuote(ctx, size, quote, null)
    blob = await canvasToBlob(canvas)
  }

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `quote-${quote.author.slug || 'quote-cloud'}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
