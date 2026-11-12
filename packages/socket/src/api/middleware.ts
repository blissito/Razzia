import { SESSION_ROLES } from "@razzia/common/constants"
import type { SessionClaims } from "@razzia/common/types/auth"
import { type ApiEnv } from "@razzia/socket/api/factory"
import { serviceKey } from "@razzia/socket/env"
import { verifyToken } from "@razzia/socket/services/auth"
import { createHash, timingSafeEqual } from "crypto"
import type { Context } from "hono"
import { createMiddleware } from "hono/factory"
import { StatusCodes } from "http-status-codes"

const UNAUTHORIZED = { error: "errors:auth.unauthorized" } as const

const digest = (value: string) => createHash("sha256").update(value).digest()

// Se comparan los hashes: mismo largo siempre y tiempo constante
export const isServiceCaller = (c: Context): boolean => {
  const token = getBearerToken(c)

  if (!serviceKey || !token) {
    return false
  }

  return timingSafeEqual(digest(token), digest(serviceKey))
}

const getBearerToken = (c: Context): string | undefined => {
  const header = c.req.header("Authorization")

  if (!header?.startsWith("Bearer ")) {
    return undefined
  }

  return header.slice("Bearer ".length)
}

export const readClaims = async (
  c: Context,
): Promise<SessionClaims | undefined> => {
  const token = getBearerToken(c)

  if (!token) {
    return undefined
  }

  try {
    return await verifyToken(token)
  } catch {
    return undefined
  }
}

export const requireSession = createMiddleware<ApiEnv>(async (c, next) => {
  const claims = await readClaims(c)

  if (!claims) {
    return c.json(UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
  }

  c.set("claims", claims)

  await next()
})

// Rutas de toda la instancia: un token de anfitrión (con `scope`) no entra
export const requireManager = createMiddleware<ApiEnv>(async (c, next) => {
  const claims = await readClaims(c)

  if (!claims || claims.role !== SESSION_ROLES.MANAGER) {
    return c.json(UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
  }

  if (claims.scope !== undefined) {
    return c.json(UNAUTHORIZED, StatusCodes.FORBIDDEN)
  }

  c.set("claims", claims)
  c.set("service", false)

  await next()
})

// La app anfitriona (SERVICE_KEY) o un manager de la instancia
export const requireManagerOrService = createMiddleware<ApiEnv>((c, next) => {
  if (isServiceCaller(c)) {
    c.set("service", true)

    return next()
  }

  return requireManager(c, next)
})

// Rutas de una sola partida (`:gameId`): el token de anfitrión entra sólo a la suya
export const requireGameManager = createMiddleware<ApiEnv>(async (c, next) => {
  const claims = await readClaims(c)

  if (!claims || claims.role !== SESSION_ROLES.MANAGER) {
    return c.json(UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
  }

  if (claims.scope !== undefined && claims.scope !== c.req.param("gameId")) {
    return c.json(UNAUTHORIZED, StatusCodes.FORBIDDEN)
  }

  c.set("claims", claims)
  c.set("service", false)

  await next()
})
