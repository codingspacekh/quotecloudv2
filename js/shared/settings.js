const loadSetting = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback
  } catch (error) {
    return fallback
  }
}

const saveSetting = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
  }
}

const loadJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch (error) {
    return fallback
  }
}

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    return false
  }
}

const setURLParam = (name, value) => {
  const url = new URL(window.location.href)
  if (value === null) {
    url.searchParams.delete(name)
  } else {
    url.searchParams.set(name, value)
  }
  history.replaceState(null, '', url)
}
