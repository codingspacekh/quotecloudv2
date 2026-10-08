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

// ---------- loading data ----------

// stop waiting for an answer after 8 seconds
const REQUEST_TIMEOUT = 8000

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Tells the page if the quotes service could be reached (layout.js shows a bar when not).
// navigator.onLine alone isn't enough: on Wi-Fi without internet it still says "online".
const reportConnection = (online) => {
  document.dispatchEvent(new CustomEvent('connection-change', { detail: { online } }))
}

// One try. When it fails, the error says why:
//   error.status = 404, 500, ...    the API answered with an error
//   error.reason = 'timeout'        the API took too long
//   error.reason = 'network'        no answer at all (offline, or the API is down)
const fetchOnce = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      // e.g. 404 or 422 means "not found", so trying again won't help
      error.status = response.status
      throw error
    }
    // no internet, so sw.js answered with a copy saved earlier
    reportConnection(!response.headers.get('X-Saved-Copy'))
    return await response.json()
  } catch (error) {
    if (controller.signal.aborted) {
      error.reason = 'timeout'
    } else if (error instanceof TypeError) {
      // fetch throws a TypeError when it gets no answer
      error.reason = 'network'
      reportConnection(false)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

// only try again when waiting a moment could help
const isWorthRetrying = (error) => {
  return error.reason === 'timeout' || error.reason === 'network' || error.status >= 500
}

// returns the parsed JSON, or throws when the API answers with an error
// (it tries once more by itself after a short problem, e.g. a slow answer)
const fetchJSON = async (url) => {
  let data
  try {
    data = await fetchOnce(url)
  } catch (error) {
    if (!isWorthRetrying(error) || !navigator.onLine) throw error
    await wait(1000)
    data = await fetchOnce(url)
  }
  return fixData(data)
}
