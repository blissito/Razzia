// Embedded in an iframe, storage can be blocked: never let it crash the UI.
export const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* Storage unavailable */
  }
}

export const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* Storage unavailable */
  }
}
