import {
  brandingColorValidator,
  gameBrandingValidator,
} from "@razzia/common/validators/branding"
import { describe, expect, it } from "vitest"

describe("brandingColorValidator", () => {
  it.each([
    "#fff",
    "#85DDCB",
    "#85ddcbcc",
    "rgb(10, 20, 30)",
    "rgba(10,20,30,0.5)",
    "rgb(10 20 30 / 50%)",
    "hsl(165, 55%, 69%)",
    "hsl(165deg 55% 69%)",
  ])("accepts %s", (color) => {
    expect(brandingColorValidator.safeParse(color).success).toBe(true)
  })

  it.each([
    "red",
    "#ff",
    "#gggggg",
    "url(https://evil.example/a.png)",
    "#fff; background: url(x)",
    "rgb(10, 20, 30); color: red",
    "var(--color-primary)",
    "rgb(calc(1), 2, 3)",
    "expression(alert(1))",
    "",
  ])("rejects %s", (color) => {
    expect(brandingColorValidator.safeParse(color).success).toBe(false)
  })
})

describe("gameBrandingValidator", () => {
  it("accepts the whitelisted shape and trims the texts", () => {
    const result = gameBrandingValidator.safeParse({
      appName: "  Acme  ",
      colors: { primary: "#85DDCB", "answer-4": "hsl(10, 20%, 30%)" },
      logo: "https://acme.example/logo.svg",
      joinHint: "Entra desde la llamada",
    })

    expect(result.success).toBe(true)
    expect(result.data?.appName).toBe("Acme")
  })

  it("accepts a full light palette with the club v2 color names", () => {
    const colors = {
      background: "#FBF7F2",
      card: "#FFFFFF",
      border: "#EADFD2",
      foreground: "#3A2412",
      "muted-foreground": "#7A6553",
      muted: "#F4EADF",
      primary: "#E8743B",
      "primary-foreground": "#2A1708",
      danger: "#B93A2B",
      "answer-1-foreground": "#0B5E4F",
    }

    expect(gameBrandingValidator.safeParse({ colors }).data?.colors).toEqual(
      colors,
    )
  })

  it.each([
    [{ logo: "http://acme.example/logo.png" }],
    [{ logo: "data:image/svg+xml,<svg/>" }],
    [{ logo: "//acme.example/logo.png" }],
    [{ colors: { unknown: "#fff" } }],
    [{ colors: { primary: "blue" } }],
    [{ font: { family: "Inter" } }],
    [{ favicon: "https://acme.example/favicon.ico" }],
  ])("rejects %j", (branding) => {
    expect(gameBrandingValidator.safeParse(branding).success).toBe(false)
  })
})
