import type { SessionClaims } from "@razzia/common/types/auth"
import { createFactory } from "hono/factory"

export interface ApiEnv {
  Variables: {
    claims: SessionClaims
    // La petición trae la SERVICE_KEY de la app anfitriona
    service: boolean
  }
}

export const apiFactory = createFactory<ApiEnv>()
