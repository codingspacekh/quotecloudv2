const PLAIN_BACKGROUND = 'plain'

let imageDialog = null
let imageQuote = null
let previewNumber = 0

const radioChoices = (name, choices) => {
  return Object.entries(choices).map(([value, choice]) => `
  <label class="choice">
    <input type="radio" name="${name}" value="${value}" class="visually-hidden">
    <span>${choice.label}${choice.hint ? ` <small>${choice.hint}</small>` : ''}</span>
  </label>
  `).join('')
}

const backgroundChoices = () => {
  let choices = ''
  for (let i = 0; i < WALLPAPER_COUNT; i++) {
    choices += `
    <label class="background-choice" title="Picture ${i + 1}">
      <input type="radio" name="background" value="${i}" class="visually-hidden" aria-label="Picture ${i + 1}">
      <span class="thumb" style="background-image: url('${getWallpaper(i)}');"></span>
    </label>
    `
  }
  choices += `
  <label class="background-choice" title="Plain color">
    <input type="radio" name="background" value="${PLAIN_BACKGROUND}" class="visually-hidden" aria-label="Plain color">
    <span class="thumb thumb-plain">Aa</span>
  </label>
  `
  return choices
}

const createImageDialog = () => {
  const dialog = document.createElement('dialog')
  dialog.className = 'dialog image-dialog'
  dialog.setAttribute('aria-labelledby', 'imageDialogTitle')
  dialog.innerHTML = `
  <h3 id="imageDialogTitle">Download as image</h3>
  <form class="image-form">
    <div class="image-preview">
      <canvas role="img" aria-label="Preview of the image"></canvas>
    </div>

    <div class="image-options">
      <fieldset>
        <legend>Size</legend>
        <div class="choices">${radioChoices('size', IMAGE_SIZES)}</div>
      </fieldset>

      <fieldset>
        <legend>Text size</legend>
        <div class="choices">${radioChoices('textSize', TEXT_SIZES)}</div>
      </fieldset>

      <fieldset>
        <legend>Background</legend>
        <div class="background-choices">${backgroundChoices()}</div>
      </fieldset>

      <div class="dialog-buttons">
        <button type="button" class="btn cancel-btn">Cancel</button>
        <button type="submit" class="btn download-btn" autofocus>
          <ion-icon name="download-outline" aria-hidden="true"></ion-icon> Download
        </button>
      </div>
    </div>
  </form>
  `

  const form = dialog.querySelector('form')

  form.addEventListener('change', updatePreview)

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    downloadImage()
  })

  dialog.querySelector('.cancel-btn').addEventListener('click', () => dialog.close())
  closeOnBackdropClick(dialog)

  document.body.appendChild(dialog)
  return dialog
}

const getImageOptions = async () => {
  const fields = imageDialog.querySelector('form').elements
  let background = fields.background.value
  return {
    size: fields.size.value,
    textSize: fields.textSize.value,
    wallpaper: background === PLAIN_BACKGROUND ? null : await loadWallpaper(parseInt(background)),
  }
}

const updatePreview = async () => {
  let thisPreview = ++previewNumber
  await loadFonts()
  const options = await getImageOptions()

  if (thisPreview !== previewNumber) return

  drawQuote(imageDialog.querySelector('canvas'), imageQuote, options)
}

const downloadImage = async () => {
  const button = imageDialog.querySelector('.download-btn')
  button.disabled = true
  try {
    const options = await getImageOptions()
    let withPicture = await downloadQuoteImage(imageQuote, options)

    saveSetting('imageSize', options.size)
    saveSetting('imageTextSize', options.textSize)

    imageDialog.close()
    showToast(withPicture ? 'Image downloaded' : 'Image downloaded without the picture (open the site with a local server to keep it)')
  } catch (error) {
    console.error('Could not create the image:', error)
    showToast('Could not create the image')
  }
  button.disabled = false
}

const openImageDialog = (quote, wallpaperIndex) => {
  if (!imageDialog) {
    imageDialog = createImageDialog()
  }
  imageQuote = quote

  const fields = imageDialog.querySelector('form').elements
  let size = loadSetting('imageSize', 'square')
  let textSize = loadSetting('imageTextSize', 'medium')
  fields.size.value = IMAGE_SIZES[size] ? size : 'square'
  fields.textSize.value = TEXT_SIZES[textSize] ? textSize : 'medium'
  fields.background.value = String(wallpaperIndex)

  imageDialog.showModal()
  updatePreview()
}
