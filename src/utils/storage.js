export function saveGame(game) {
  try {
    const key = 'uno_mvp1'
    localStorage.setItem(key, JSON.stringify(game))
  } catch (e) {
    console.warn('saveGame failed', e)
  }
}

export function loadGame() {
  try {
    const key = 'uno_mvp1'
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('loadGame failed', e)
    return null
  }
}
