import type { SESSION_ROLES } from "@razzia/common/constants"

export type SessionRole = (typeof SESSION_ROLES)[keyof typeof SESSION_ROLES]

export interface SessionClaims {
  sub: string
  role: SessionRole
  /** Present on a host token: the only game this manager session may run. */
  scope?: string
  iat: number
  exp: number
}

export interface SessionResponse {
  token: string
  clientId: string
  role: SessionRole
  expiresAt: number
}

export interface JoinTicketClaims {
  sub: string
  gameId: string
  username?: string
  iat: number
  exp: number
}
