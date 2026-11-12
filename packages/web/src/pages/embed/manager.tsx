import { setToken } from "@razzia/web/lib/session"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

// Token handoff for an embedding host app: the host's server creates the game
// with a manager session and opens this page with the token in the URL hash
// (a hash never reaches the server, access logs or Referer headers).
//   /embed/manager#token=<jwt>&gameId=<id>   -> the game board
//   /embed/manager#token=<jwt>&to=quizz      -> the quiz editor
const DESTINATIONS: Record<string, string> = {
  quizz: "/manager/quizz",
  config: "/manager/config",
}

const GAME_ID_PATTERN = /^[\w-]{1,64}$/u

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

    // A full reload, so the socket handshake starts from the new token
    window.location.replace(resolveTarget(params))
  }, [])

  return null
}

export const Route = createFileRoute("/embed/manager")({
  component: EmbedManagerPage,
})
