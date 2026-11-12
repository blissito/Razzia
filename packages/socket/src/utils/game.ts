import { MAX_POINTS } from "@razzia/common/constants"
import type { Question } from "@razzia/common/types/game"
import type { Socket } from "@razzia/common/types/game/socket"
import Game from "@razzia/socket/services/game"
import Registry from "@razzia/socket/services/registry"
import { SECOND_MS } from "@razzia/socket/utils/sleep"
import { canManageGame, getClientId } from "@razzia/socket/utils/socket"

type GameCallback = (_game: Game) => void | Promise<void>

const resolveGame = (gameId: string | undefined): Game | undefined =>
  gameId ? Registry.getInstance().getGameById(gameId) : undefined

export const withManagerGame = (
  gameId: string | undefined,
  socket: Socket,
  callback: GameCallback,
): void => {
  const game = resolveGame(gameId)

  if (!game) {
    socket.emit("game:errorMessage", "errors:game.notFound")

    return
  }

  if (
    game.manager.clientId !== getClientId(socket) ||
    !canManageGame(socket, game.gameId)
  ) {
    socket.emit("game:errorMessage", "errors:auth.unauthorized")

    return
  }

  callback(game)
}

export const withPlayerGame = (
  gameId: string | undefined,
  socket: Socket,
  callback: GameCallback,
): void => {
  const game = resolveGame(gameId)

  if (!game) {
    socket.emit("game:errorMessage", "errors:game.notFound")

    return
  }

  if (!game.players.some((p) => p.clientId === getClientId(socket))) {
    socket.emit("game:errorMessage", "errors:auth.unauthorized")

    return
  }

  callback(game)
}

export const createInviteCode = (length = 6) => {
  let result = ""
  const characters = "0123456789"
  const charactersLength = characters.length

  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * charactersLength)
    result += characters.charAt(randomIndex)
  }

  return result
}

const MAX_INVITE_CODE_ATTEMPTS = 100

// Con muchas partidas vivas dos códigos de 6 dígitos pueden coincidir: se vuelve a tirar.
export const createUniqueInviteCode = (
  isTaken: (_code: string) => boolean = (code) =>
    Registry.getInstance().getGameByInviteCode(code) !== undefined,
  generate: () => string = createInviteCode,
): string => {
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
    const code = generate()

    if (!isTaken(code)) {
      return code
    }
  }

  throw new Error("No free invite code")
}

export const orderToPoint = (
  index: number,
  totalPlayers: number,
  maxPoints = MAX_POINTS,
): number => {
  if (totalPlayers <= 1) {
    return maxPoints
  }

  return Math.round(maxPoints - (index / (totalPlayers - 1)) * (maxPoints / 2))
}

export const timeToPoint = (startTime: number, question: Question): number => {
  const maxPoints = question.maxPoints ?? MAX_POINTS
  let points = maxPoints

  const actualTime = Date.now()
  const tempsPasseEnSecondes = (actualTime - startTime) / SECOND_MS

  points -= (maxPoints / question.time) * tempsPasseEnSecondes
  points = Math.max(0, points)

  return points
}
