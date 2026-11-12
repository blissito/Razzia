import { applyGameBranding, loadGameBranding } from "@razzia/web/branding"
import { useEffect } from "react"

// Tablero y jugador muestran la marca de la app anfitriona mientras dura la partida
export const useGameBranding = (gameId: string | undefined) => {
  useEffect(() => {
    if (!gameId) {
      return undefined
    }

    let cancelled = false
    let revert: (() => void) | null = null

    void loadGameBranding(gameId).then((branding) => {
      if (branding && !cancelled) {
        revert = applyGameBranding(branding)
      }
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [gameId])
}
