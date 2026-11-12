import { z } from "zod"

// Marca por partida: sólo esta forma cerrada llega al navegador de los jugadores,
// así que cada campo se valida aquí (servidor) y otra vez en el cliente.
export const BRANDING_COLOR_NAMES = [
  "primary",
  "secondary",
  "answer-1",
  "answer-2",
  "answer-3",
  "answer-4",
  "correct",
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
] as const

export type BrandingColorName = (typeof BRANDING_COLOR_NAMES)[number]

const HEX_COLOR = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/iu

// Sólo dígitos, puntos, %, comas, espacios y diagonal: ni `url(`, ni `;`, ni `var(`.
const FUNCTION_COLOR =
  /^(?:rgb|hsl)a?\(\s*\d{1,3}(?:\.\d{1,4})?(?:deg|%)?(?:\s*[,\s/]\s*\d{1,3}(?:\.\d{1,4})?%?){2,3}\s*\)$/iu

const MAX_COLOR_LENGTH = 64
const MAX_URL_LENGTH = 2048

export const brandingColorValidator = z
  .string()
  .max(MAX_COLOR_LENGTH, "errors:invalidRequest")
  .refine(
    (value) => HEX_COLOR.test(value) || FUNCTION_COLOR.test(value),
    "errors:invalidRequest",
  )

const httpsUrlValidator = z
  .string()
  .max(MAX_URL_LENGTH, "errors:invalidRequest")
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:"
    } catch {
      return false
    }
  }, "errors:invalidRequest")

export const gameBrandingValidator = z.strictObject(
  {
    appName: z.string().trim().min(1).max(60).optional(),
    colors: z
      .partialRecord(z.enum(BRANDING_COLOR_NAMES), brandingColorValidator)
      .optional(),
    logo: httpsUrlValidator.optional(),
    joinHint: z.string().trim().min(1).max(160).optional(),
  },
  "errors:invalidRequest",
)

export type GameBranding = z.infer<typeof gameBrandingValidator>
