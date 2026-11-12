import {
  gameBrandingValidator,
  type GameBranding,
} from "@razzia/common/validators/branding"
import { useSyncExternalStore, type ReactEventHandler } from "react"
import { z } from "zod"

const brandingSchema = z.object({
  appName: z.string().optional(),
  colors: z.record(z.string(), z.string()).optional(),
  answerColors: z.array(z.string()).optional(),
  font: z.object({ family: z.string(), url: z.string().optional() }).optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  background: z.string().optional(),
  joinHint: z.string().optional(),
})

export type BrandingTheme = z.infer<typeof brandingSchema>

let current: BrandingTheme | null = null
// Marca de la partida en curso; va encima del tema de la instancia
let gameBranding: GameBranding | null = null
let merged: BrandingTheme | null = null
const listeners = new Set<() => void>()

const refresh = () => {
  merged = gameBranding ? { ...current, ...gameBranding } : current
  listeners.forEach((listener) => {
    listener()
  })
}

export const getBranding = (): BrandingTheme | null => merged

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

// Para componentes que deben repintarse cuando llega la marca de la partida
export const useBranding = (): BrandingTheme | null =>
  useSyncExternalStore(subscribe, getBranding)

const getGameBrand = (): GameBranding | null => gameBranding

// Marca de la partida en curso; null mientras sólo aplica el tema de la instancia
export const useGameBrand = (): GameBranding | null =>
  useSyncExternalStore(subscribe, getGameBrand)

// La marca que llegó con el PIN se guarda para que el tablero del jugador abra ya pintado
const knownGameBrandings = new Map<string, GameBranding>()

export const rememberGameBranding = (gameId: string, branding: GameBranding) =>
  knownGameBrandings.set(gameId, branding)

export const recallGameBranding = (gameId: string): GameBranding | null =>
  knownGameBrandings.get(gameId) ?? null

const LIGHT_THRESHOLD = 0.6

// Luminosidad aproximada (0 a 1) de un color hex, rgb() o hsl()
const lightnessOf = (color: string): number | null => {
  const hex = /^#([\da-f]{3,8})$/iu.exec(color.trim())?.[1]

  if (hex) {
    const size = hex.length <= 4 ? 1 : 2
    const [r, g, b] = [0, 1, 2].map(
      (i) =>
        parseInt(hex.slice(i * size, i * size + size).padEnd(2, hex[i]), 16) /
        255,
    )

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const numbers = color.match(/[\d.]+/gu)?.map(Number)

  if (!numbers || numbers.length < 3) {
    return null
  }

  if (/^hsl/iu.test(color)) {
    return numbers[2] / 100
  }

  const [r, g, b] = numbers.map((n) => n / 255)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const darkened = (name: string) =>
  `color-mix(in oklab, var(--color-${name}) 32%, var(--color-foreground))`

// Sobre un fondo claro los tonos pastel no se leen como texto: lo que la marca
// no trae definido se oscurece hacia su color de texto.
const LIGHT_DEFAULTS: Record<string, string> = {
  "answer-1-foreground": darkened("answer-1"),
  "answer-2-foreground": darkened("answer-2"),
  "answer-3-foreground": darkened("answer-3"),
  "answer-4-foreground": darkened("answer-4"),
  correct: "#3f8f4a",
  danger: "#b93a2b",
}

export const withDerivedColors = (
  colors: Record<string, string | undefined>,
): Record<string, string> => {
  const given = Object.fromEntries(
    Object.entries(colors).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  )
  const lightness = given.background ? lightnessOf(given.background) : null

  if (lightness === null || lightness < LIGHT_THRESHOLD) {
    return given
  }

  return { ...LIGHT_DEFAULTS, ...given }
}

export const loadBranding = async (): Promise<BrandingTheme | null> => {
  try {
    const response = await fetch("/branding/theme.json", {
      cache: "no-cache",
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) {
      return null
    }

    const parsed = brandingSchema.safeParse(await response.json())
    current = parsed.success ? parsed.data : null
    refresh()

    return current
  } catch {
    return null
  }
}

export const applyBranding = (theme: BrandingTheme | null): void => {
  if (!theme) {
    return
  }

  const root = document.documentElement

  if (theme.colors) {
    for (const [name, value] of Object.entries(
      withDerivedColors(theme.colors),
    )) {
      root.style.setProperty(`--color-${name}`, value)
    }
  }

  theme.answerColors?.forEach((color, index) => {
    root.style.setProperty(`--color-answer-${index + 1}`, color)
  })

  if (theme.font) {
    if (theme.font.url) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = theme.font.url
      document.head.appendChild(link)
    }

    root.style.setProperty(
      "--font-display",
      `"${theme.font.family}", sans-serif`,
    )
  }

  if (theme.appName) {
    document.title = theme.appName
  }

  if (theme.favicon) {
    const favicon = document.querySelector<HTMLLinkElement>("link#favicon")

    if (favicon) {
      favicon.href = theme.favicon
    }
  }
}

export const loadGameBranding = async (
  gameId: string,
): Promise<GameBranding | null> => {
  try {
    const response = await fetch(
      `/api/games/${encodeURIComponent(gameId)}/branding`,
      { signal: AbortSignal.timeout(4000) },
    )

    if (!response.ok) {
      return null
    }

    const body = (await response.json()) as { branding?: unknown }
    // Misma validación que en el servidor: nada fuera de la lista llega al DOM
    const parsed = gameBrandingValidator.safeParse(body.branding)

    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/**
 * Pone la marca de una partida encima del tema de la instancia y regresa la
 * función que la quita (al salir de la partida vuelve el tema de la instancia).
 */
export const applyGameBranding = (branding: GameBranding): (() => void) => {
  const root = document.documentElement
  const previousTitle = document.title
  const colors = withDerivedColors(branding.colors ?? {})
  const previousColors = Object.keys(colors).map(
    (name) =>
      [
        `--color-${name}`,
        root.style.getPropertyValue(`--color-${name}`),
      ] as const,
  )

  for (const [name, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${name}`, value)
  }

  if (branding.appName) {
    document.title = branding.appName
  }

  gameBranding = branding
  refresh()

  return () => {
    previousColors.forEach(([property, value]) => {
      if (value) {
        root.style.setProperty(property, value)
      } else {
        root.style.removeProperty(property)
      }
    })
    document.title = previousTitle

    if (gameBranding === branding) {
      gameBranding = null
      refresh()
    }
  }
}

export const imageFallback =
  (fallback: string): ReactEventHandler<HTMLImageElement> =>
  (event) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = fallback
  }
