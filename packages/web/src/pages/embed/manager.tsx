import { setToken } from "@razzia/web/lib/session"
import { safeSet } from "@razzia/web/lib/storage"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

// Token handoff for an embedding host app: the host's server creates the game
// with a manager session and opens this page with the token in the URL hash
// (a hash never reaches the server, access logs or Referer headers).
//   /embed/manager#token=<jwt>&gameId=<id>   -> the game board
//   /embed/manager#token=<jwt>&to=quizz      -> the quiz editor
// An optional `join=<https url>` next to gameId is the host app's own entry
// link for players; the lobby board shows it as the QR code.
const DESTINATIONS: Record<string, string> = {
  quizz: "/manager/quizz",
  config: "/manager/config",
}

const GAME_ID_PATTERN = /^[\w-]{1,64}$/u

const joinUrlKey = (gameId: string) => `embed_join_${gameId}`

const resolveTarget = (params: URLSearchParams): string => {
  const gameId = params.get("gameId")

  if (gameId && GAME_ID_PATTERN.test(gameId)) {
    return `/party/manager/${gameId}`
  }

  return DESTINATIONS[params.get("to") ?? ""] ?? "/manager"
}

const EmbedManagerPage = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get("token")

    if (token) {
      setToken(token)
    }

    const gameId = params.get("gameId")
    const join = params.get("join")

    if (
      gameId &&
      GAME_ID_PATTERN.test(gameId) &&
      join?.startsWith("https://")
    ) {
      safeSet(joinUrlKey(gameId), join)
    }

    // A full reload, so the socket handshake starts from the new token
    window.location.replace(resolveTarget(params))
  }, [])

  return null
}

export const Route = createFileRoute("/embed/manager")({
  component: EmbedManagerPage,
})
