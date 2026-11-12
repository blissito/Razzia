import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const styles = new Map<string, string>()
const fetchMock = vi.fn<typeof fetch>()
const fakeDocument = {
  title: "Instance",
  documentElement: {
    style: {
      setProperty: (name: string, value: string) => styles.set(name, value),
      getPropertyValue: (name: string) => styles.get(name) ?? "",
      removeProperty: (name: string) => styles.delete(name),
    },
  },
}

const loadModule = () => import("@razzia/web/branding")

beforeEach(() => {
  vi.resetModules()
  styles.clear()
  fakeDocument.title = "Instance"
  fetchMock.mockReset()
  vi.stubGlobal("document", fakeDocument)
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("applyGameBranding", () => {
  it("puts the game brand over the instance theme and reverts it", async () => {
    const { applyGameBranding, getBranding } = await loadModule()

    // Tema de la instancia ya aplicado; `secondary` no lo define nadie
    styles.set("--color-primary", "#111111")

    const revert = applyGameBranding({
      appName: "Acme",
      colors: { primary: "#85DDCB", secondary: "#222222" },
      joinHint: "Entra desde la llamada",
    })

    expect(styles.get("--color-primary")).toBe("#85DDCB")
    expect(styles.get("--color-secondary")).toBe("#222222")
    expect(fakeDocument.title).toBe("Acme")
    expect(getBranding()).toMatchObject({ joinHint: "Entra desde la llamada" })

    revert()

    expect(styles.get("--color-primary")).toBe("#111111")
    expect(styles.has("--color-secondary")).toBe(false)
    expect(fakeDocument.title).toBe("Instance")
    expect(getBranding()).toBeNull()
  })
})

describe("withDerivedColors", () => {
  it("leaves a dark palette as the brand sent it", async () => {
    const { withDerivedColors } = await loadModule()
    const colors = { background: "#0E1317", primary: "#85DDCB" }

    expect(withDerivedColors(colors)).toEqual(colors)
    expect(withDerivedColors({ primary: "#85DDCB" })).toEqual({
      primary: "#85DDCB",
    })
  })

  it.each(["#FBF7F2", "#fff", "rgb(251, 247, 242)", "hsl(33, 53%, 97%)"])(
    "darkens the answer text and the status colors on the light background %s",
    async (background) => {
      const { withDerivedColors } = await loadModule()
      const derived = withDerivedColors({ background, correct: "#00aa00" })

      expect(derived["answer-1-foreground"]).toContain("--color-answer-1")
      expect(derived.danger).toBe("#b93a2b")
      // Lo que la marca sí manda no se toca
      expect(derived.correct).toBe("#00aa00")
    },
  )
})

describe("loadGameBranding", () => {
  it("drops a branding the validator refuses", async () => {
    const { loadGameBranding } = await loadModule()

    fetchMock.mockResolvedValueOnce(
      Response.json({ branding: { colors: { primary: "url(x)" } } }),
    )

    expect(await loadGameBranding("game")).toBeNull()

    fetchMock.mockResolvedValueOnce(
      Response.json({ branding: { colors: { primary: "#fff" } } }),
    )

    expect(await loadGameBranding("game")).toEqual({
      colors: { primary: "#fff" },
    })
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game/branding",
      expect.anything(),
    )
  })
})
