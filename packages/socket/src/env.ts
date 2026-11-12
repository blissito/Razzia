import { randomBytes } from "crypto"
import z from "zod"

const MIN_SECRET_LENGTH = 32

const optional = (schema: z.ZodString) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional())

const envSchema = z.object({
  MANAGER_PASSWORD: optional(
    z.string().min(1, "MANAGER_PASSWORD cannot be empty"),
  ),
  JWT_SECRET: optional(
    z
      .string()
      .min(
        MIN_SECRET_LENGTH,
        `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
      ),
  ),
  // Shared with a host app that vouches for its players (see services/identity.ts).
  IDENTITY_SECRET: optional(
    z
      .string()
      .min(
        MIN_SECRET_LENGTH,
        `IDENTITY_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
      ),
  ),
  // Llave del servidor de la app anfitriona: crea partidas y lee resultados sin sesión de manager.
  SERVICE_KEY: optional(
    z
      .string()
      .min(
        MIN_SECRET_LENGTH,
        `SERVICE_KEY must be at least ${MIN_SECRET_LENGTH} characters`,
      ),
  ),
  // "1" refuses every join that does not carry a valid identity.
  REQUIRE_IDENTITY: optional(z.string()),
  GAME_SPEED: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .positive("GAME_SPEED must be a positive number")
      .default(1),
  ),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(
    `Invalid environment:\n${parsed.error.issues
      .map((issue) => `  - ${issue.message}`)
      .join("\n")}`,
  )
}

export const managerPassword = parsed.data.MANAGER_PASSWORD

export const gameSpeed = parsed.data.GAME_SPEED

export const identitySecret = parsed.data.IDENTITY_SECRET

export const serviceKey = parsed.data.SERVICE_KEY

export const requireIdentity =
  Boolean(identitySecret) && parsed.data.REQUIRE_IDENTITY === "1"

export const jwtSecret =
  parsed.data.JWT_SECRET ?? randomBytes(32).toString("hex")
