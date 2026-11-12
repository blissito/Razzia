import "@fontsource-variable/rubik/wght.css"
import { applyBranding, loadBranding } from "@razzia/web/branding"
import Toaster from "@razzia/web/components/Toaster"
import { socketClient } from "@razzia/web/features/game/contexts/socket-context"
import "@razzia/web/i18n"
import "@razzia/web/index.css"
import { isMutedEmbed } from "@razzia/web/lib/embed"
import { routeTree } from "@razzia/web/route.gen"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { Howler } from "howler"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const router = createRouter({ routeTree, context: { socket: socketClient } })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element not found")
}

// Embedded next to a video call, the player view stays silent (?mute=1):
// the shared game board already carries the sound for everyone.
if (isMutedEmbed()) {
  Howler.mute(true)
}

applyBranding(await loadBranding())

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
)
