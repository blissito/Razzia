import { identitySecret } from "@razzia/socket/env"
import { createHmac, timingSafeEqual } from "crypto"

// A host app that embeds Razzia can vouch for who a player is. It signs
// `base64url(JSON payload) + "." + hex(HMAC-SHA256(payload part))` with the
// shared IDENTITY_SECRET; the payload is { sub, name, exp, pin? }.
//   sub  the host app's own user id, saved with the results as `externalId`
//   name the display name, imposed on the player (nobody can pick another)
//   exp  unix seconds
//   pin  optional invite code, so a token cannot be replayed in another game
export interface Identity {
  sub: string
  name: string
}

const MAX_SUB_LENGTH = 64
const MAX_NAME_LENGTH = 24

const sign = (part: string, secret: string) =>
  createHmac("sha256", secret).update(part).digest()

export const verifyIdentity = (
  token: string,
  inviteCode: string,
  secret = identitySecret,
): Identity | null => {
  if (!secret) {
    return null
  }

  const [part, signature, ...rest] = token.split(".")

  if (!part || !signature || rest.length > 0) {
    return null
  }

  const given = Buffer.from(signature, "hex")
  const expected = sign(part, secret)

  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(part, "base64url").toString("utf8"),
    ) as Record<string, unknown>
    const { sub, name, exp, pin } = payload

    if (
      typeof sub !== "string" ||
      sub.length < 1 ||
      sub.length > MAX_SUB_LENGTH ||
      typeof name !== "string" ||
      typeof exp !== "number" ||
      exp <= Math.floor(Date.now() / 1000) ||
      (pin !== undefined && pin !== inviteCode)
    ) {
      return null
    }

    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH)

    return trimmed ? { sub, name: trimmed } : null
  } catch {
    return null
  }
}
