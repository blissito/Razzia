import {
  applyGameBranding,
  loadGameBranding,
  recallGameBranding,
} from "@razzia/web/branding"
import { useLayoutEffect } from "react"

// Tablero y jugador muestran la marca de la app anfitriona mientras dura la partida
export const useGameBranding = (gameId: string | undefined) => {
  useLayoutEffect(() => {
    if (!gameId) {
      return undefined
    }

    let cancelled = false
    // Si la marca ya llegó con el PIN se pinta antes del primer cuadro
    const known = recallGameBranding(gameId)
    let revert: (() => void) | null = known ? applyGameBranding(known) : null

    void loadGameBranding(gameId).then((branding) => {
      if (branding && !cancelled) {
        revert?.()
        revert = applyGameBranding(branding)
      }
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [gameId])
}
