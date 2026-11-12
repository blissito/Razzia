import { verifyIdentity } from "@razzia/socket/services/identity"
import { createHmac } from "crypto"
import { describe, expect, it } from "vitest"

const SECRET = "s".repeat(32)
const future = () => Math.floor(Date.now() / 1000) + 600

const mint = (payload: Record<string, unknown>, secret = SECRET) => {
  const part = Buffer.from(JSON.stringify(payload)).toString("base64url")

  return `${part}.${createHmac("sha256", secret).update(part).digest("hex")}`
}

describe("verifyIdentity", () => {
  it("accepts a token signed with the shared secret", () => {
    const token = mint({ sub: "u1", name: " Ana Pérez ", exp: future() })

    expect(verifyIdentity(token, "123456", SECRET)).toEqual({
      sub: "u1",
      name: "Ana Pérez",
    })
  })

  it("is disabled without a secret", () => {
    const token = mint({ sub: "u1", name: "Ana", exp: future() })

    expect(verifyIdentity(token, "123456", undefined)).toBeNull()
  })

  it("rejects a forged, expired or malformed token", () => {
    const forged = mint(
      { sub: "u1", name: "Ana", exp: future() },
      "x".repeat(32),
    )
    const expired = mint({ sub: "u1", name: "Ana", exp: 1 })

    expect(verifyIdentity(forged, "123456", SECRET)).toBeNull()
    expect(verifyIdentity(expired, "123456", SECRET)).toBeNull()
    expect(verifyIdentity("nope", "123456", SECRET)).toBeNull()
    expect(verifyIdentity("a.b.c", "123456", SECRET)).toBeNull()
  })

  it("binds the token to one game when it carries a pin", () => {
    const token = mint({ sub: "u1", name: "Ana", exp: future(), pin: "123456" })

    expect(verifyIdentity(token, "123456", SECRET)).not.toBeNull()
    expect(verifyIdentity(token, "654321", SECRET)).toBeNull()
  })

  it("caps the name at 24 characters and refuses an empty one", () => {
    const long = mint({ sub: "u1", name: "x".repeat(40), exp: future() })
    const empty = mint({ sub: "u1", name: "   ", exp: future() })

    expect(verifyIdentity(long, "123456", SECRET)?.name).toHaveLength(24)
    expect(verifyIdentity(empty, "123456", SECRET)).toBeNull()
  })
})
