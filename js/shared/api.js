// Talking to the quotes API

// api.quotable.io is deprecated, this is a community mirror with the same data
// Docs: https://github.com/Kurokeita/quotable

const API_URL = "https://api.quotable.kurokeita.dev/api"

// ---------- fixing broken names from the API ----------

// Some names in the API are stored with broken characters,
// e.g. "MoliÃ¨re" is saved as "Molié¨re" instead of "Molière".
// The broken text is really UTF-8 bytes read one byte per letter
// (with "Ã" also replaced by "é"), so we turn the letters back into bytes
// and decode them properly. Text that is already correct is returned unchanged.
const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

const fixText = (text) => {
  let restored = text.replace(/é([\x80-\xBF])/g, 'Ã$1')
  let codes = Array.from(restored, char => char.charCodeAt(0))

  // nothing to fix: plain English text, or a letter that can't be a byte
  if (codes.every(code => code < 128) || codes.some(code => code > 255)) {
    return text
  }

  try {
    return utf8Decoder.decode(new Uint8Array(codes))
  } catch (error) {
    // not valid UTF-8 bytes, so the text was already correct (e.g. "René")
    return text
  }
}

// run fixText on every string inside the API response
const fixData = (value) => {
  if (typeof value === 'string') return fixText(value)
  if (Array.isArray(value)) return value.map(fixData)
  if (value && typeof value === 'object') {
    let fixed = {}
    for (let key in value) {
      fixed[key] = fixData(value[key])
    }
    return fixed
  }
  return value
}

// returns the parsed JSON, or throws when the API answers with an error
const fetchJSON = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`)
    // e.g. 404 or 422 means "not found", so trying again won't help
    error.status = response.status
    throw error
  }
  const data = await response.json()
  return fixData(data)
}
