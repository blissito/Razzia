const MUTE_KEY = "embed_mute"

// The flag arrives once in the query string and has to survive reloads of
// the game page, whose URL no longer carries it.
export const isMutedEmbed = (): boolean => {
  const fromUrl = new URLSearchParams(window.location.search).get("mute")

  try {
    if (fromUrl !== null) {
      sessionStorage.setItem(MUTE_KEY, fromUrl === "1" ? "1" : "0")
    }

    return sessionStorage.getItem(MUTE_KEY) === "1"
  } catch {
    return fromUrl === "1"
  }
}
