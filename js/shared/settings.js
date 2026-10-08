// Small choices the visitor made (theme, quote length, author sort),
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
