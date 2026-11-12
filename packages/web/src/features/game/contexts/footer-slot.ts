import { createContext, useContext } from "react"

// Hueco a la izquierda del botón principal del tablero: la sala de espera
// cuelga ahí los nombres de quienes van entrando.
export const FooterSlotContext = createContext<HTMLElement | null>(null)

export const useFooterSlot = () => useContext(FooterSlotContext)
