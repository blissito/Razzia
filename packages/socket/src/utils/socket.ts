import type { Socket } from "@razzia/common/types/game/socket"

export const getClientId = (socket: Socket): string => socket.data.clientId

// Un token de anfitrión sólo puede tocar la partida de su `scope`
export const canManageGame = (socket: Socket, gameId: string): boolean =>
  socket.data.scope === undefined || socket.data.scope === gameId
