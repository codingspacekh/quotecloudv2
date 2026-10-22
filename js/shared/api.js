const API_URL = "https://api.quotable.kurokeita.dev/api"

const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

const fixText = (text) => {
  let restored = text.replace(/é([\x80-\xBF])/g, 'Ã$1')
  let codes = Array.from(restored, char => char.charCodeAt(0))

  if (codes.every(code => code < 128) || codes.some(code => code > 255)) {
    return text
  }

  try {
    return utf8Decoder.decode(new Uint8Array(codes))
  } catch (error) {
    return text
  }
}

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

const REQUEST_TIMEOUT = 8000

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const reportConnection = (online) => {
  document.dispatchEvent(new CustomEvent('connection-change', { detail: { online } }))
}

const fetchOnce = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    reportConnection(!response.headers.get('X-Saved-Copy'))
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.status = response.status
      throw error
    }
    return await response.json()
  } catch (error) {
    if (controller.signal.aborted) {
      error.reason = 'timeout'
    } else if (error instanceof TypeError) {
      error.reason = 'network'
      reportConnection(false)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

const isWorthRetrying = (error) => {
  return error.reason === 'timeout' || error.reason === 'network' || error.status >= 500
}

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
