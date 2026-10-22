// Small choices the visitor made (theme, quote length, author sort) and saved data,
// remembered in this browser with localStorage.

// localStorage can be blocked (e.g. private windows), then we just don't remember
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
    // can't remember it, but the choice still works on this page
  }
}

// bigger data (lists of quotes, collections) saved as JSON
const loadJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch (error) {
    return fallback
  }
}

// returns false when the browser would not save it (blocked, or storage is full)
const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    return false
  }
}

// keeps a choice in the address (?name=value), so refreshing or sharing the link keeps it.
// value null removes it from the address
const setURLParam = (name, value) => {
  const url = new URL(window.location.href)
  if (value === null) {
    url.searchParams.delete(name)
  } else {
    url.searchParams.set(name, value)
  }
  history.replaceState(null, '', url)
}
