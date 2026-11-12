import { zValidator } from "@hono/zod-validator"
import { SESSION_ROLES } from "@razzia/common/constants"
import {
  checkGameValidator,
  createGameValidator,
  gameSettingsValidator,
  joinGameValidator,
} from "@razzia/common/validators/game"
import { apiFactory } from "@razzia/socket/api/factory"
import {
  requireGameManager,
  requireManagerOrService,
  requireSession,
} from "@razzia/socket/api/middleware"
import { i18nHook } from "@razzia/socket/api/validation"
import {
  mintJoinTicket,
  mintToken,
  newClientId,
} from "@razzia/socket/services/auth"
import { getQuizz } from "@razzia/socket/services/config"
import { identitySecret, requireIdentity } from "@razzia/socket/env"
import { verifyIdentity } from "@razzia/socket/services/identity"
import Game from "@razzia/socket/services/game"
import { getIo } from "@razzia/socket/services/io"
import Registry from "@razzia/socket/services/registry"
import { bodyLimit } from "hono/body-limit"
import { StatusCodes } from "http-status-codes"

// Un quiz en línea de 100 preguntas cabe de sobra
const MAX_CREATE_BODY = 256 * 1024

const routes = apiFactory
  .createApp()
  .post(
    "/",
    bodyLimit({
      maxSize: MAX_CREATE_BODY,
      onError: (c) =>
        c.json(
          { error: "errors:invalidRequest" },
          StatusCodes.REQUEST_TOO_LONG,
        ),
    }),
    requireManagerOrService,
    zValidator("json", createGameValidator, i18nHook),
    async (c) => {
      const body = c.req.valid("json")
      const quizz = body.quizz ?? getQuizz().find((q) => q.id === body.quizzId)

      if (!quizz) {
        return c.json({ error: "errors:quizz.notFound" }, StatusCodes.NOT_FOUND)
      }

      // La app anfitriona no tiene sesión: la partida nace con un dueño nuevo
      const isService = c.get("service")
      const managerId = isService ? newClientId() : c.get("claims").sub
      const registry = Registry.getInstance()
      const game = new Game(getIo(), managerId, quizz)

      game.requireIdentity = Boolean(body.requireIdentity && identitySecret)
      game.tenant = body.tenant
      game.branding = body.branding ?? null
      registry.addGame(game)
      registry.markGameAsEmpty(game)

      if (!isService) {
        return c.json(
          { gameId: game.gameId, inviteCode: game.inviteCode },
          StatusCodes.CREATED,
        )
      }

      // Token de anfitrión: manager sólo de esta partida, para el navegador de quien la conduce
      const host = await mintToken(
        managerId,
        SESSION_ROLES.MANAGER,
        game.gameId,
      )

      return c.json(
        {
          gameId: game.gameId,
          inviteCode: game.inviteCode,
          hostToken: host.token,
          hostTokenExpiresAt: host.expiresAt,
        },
        StatusCodes.CREATED,
      )
    },
  )
  // Pública: la pantalla del jugador la pide al entrar a la partida
  .get("/:gameId/branding", (c) => {
    const game = Registry.getInstance().getGameById(c.req.param("gameId"))

    if (!game) {
      return c.json({ error: "errors:game.notFound" }, StatusCodes.NOT_FOUND)
    }

    return c.json({ branding: game.branding })
  })
  .patch(
    "/:gameId/settings",
    requireGameManager,
    zValidator("json", gameSettingsValidator, i18nHook),
    (c) => {
      const game = Registry.getInstance().getGameById(c.req.param("gameId"))

      if (!game || game.manager.clientId !== c.get("claims").sub) {
        return c.json({ error: "errors:game.notFound" }, StatusCodes.NOT_FOUND)
      }

      if (!game.updateSettings(c.req.valid("json"))) {
        return c.json(
          { error: "errors:game.alreadyStarted" },
          StatusCodes.CONFLICT,
        )
      }

      return c.json({ settings: game.settings })
    },
  )
  .post("/check", zValidator("json", checkGameValidator, i18nHook), (c) => {
    const { inviteCode } = c.req.valid("json")
    const game = Registry.getInstance().getGameByInviteCode(inviteCode)

    if (!game) {
      return c.json({ error: "errors:game.notFound" }, StatusCodes.NOT_FOUND)
    }

    if (game.locked) {
      return c.json({ error: "errors:game.locked" }, StatusCodes.FORBIDDEN)
    }

    // Con el PIN ya se sabe de quién es la partida: la pantalla de nombre toma su marca
    return c.json({
      generatedUsernames: game.settings.generatedUsernames,
      subject: game.subject,
      totalQuestions: game.totalQuestions,
      branding: game.branding,
    })
  })
  .post(
    "/join",
    requireSession,
    zValidator("json", joinGameValidator, i18nHook),
    async (c) => {
      const { inviteCode, username, identity } = c.req.valid("json")
      const game = Registry.getInstance().getGameByInviteCode(inviteCode)
      const verified = identity ? verifyIdentity(identity, inviteCode) : null

      if ((requireIdentity || game?.requireIdentity) && !verified) {
        return c.json(
          { error: "errors:auth.unauthorized" },
          StatusCodes.FORBIDDEN,
        )
      }

      if (!game) {
        return c.json({ error: "errors:game.notFound" }, StatusCodes.NOT_FOUND)
      }

      const { sub } = c.get("claims")

      if (game.manager.clientId === sub) {
        return c.json(
          { error: "errors:game.managerCannotJoin" },
          StatusCodes.FORBIDDEN,
        )
      }

      const existing = game.players.find((p) => p.clientId === sub)

      if (existing) {
        return c.json({
          gameId: game.gameId,
          ticket: null,
          username: existing.username,
        })
      }

      if (game.locked) {
        return c.json({ error: "errors:game.locked" }, StatusCodes.FORBIDDEN)
      }

      // A vouched-for player keeps the name the host app signed
      const requestedName = verified?.name ?? username

      if (!game.settings.generatedUsernames && !requestedName) {
        return c.json(
          { error: "errors:auth.usernameTooShort" },
          StatusCodes.BAD_REQUEST,
        )
      }

      const name = game.settings.generatedUsernames ? undefined : requestedName

      if (verified) {
        game.setExternalId(sub, verified.sub)
      }

      return c.json({
        gameId: game.gameId,
        ticket: await mintJoinTicket(sub, game.gameId, name),
        username: name ?? null,
      })
    },
  )

export const games = routes
