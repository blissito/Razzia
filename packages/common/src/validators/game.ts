import { AUTO_ADVANCE_DELAY } from "@razzia/common/constants"
import {
  inviteCodeValidator,
  usernameValidator,
} from "@razzia/common/validators/auth"
import z from "zod"

export const createGameValidator = z.object({
  quizzId: z.string().min(1, "errors:quizz.notFound"),
  // Members-only game: every join needs a signed identity (needs IDENTITY_SECRET)
  requireIdentity: z.boolean().optional(),
})

export const checkGameValidator = z.object({
  inviteCode: inviteCodeValidator,
})

export const joinGameValidator = z.object({
  inviteCode: inviteCodeValidator,
  username: usernameValidator.optional(),
  // Signed by an embedding host app, see socket/src/services/identity.ts
  identity: z.string().max(1024).optional(),
})

const delayValidator = z
  .number()
  .int()
  .min(AUTO_ADVANCE_DELAY.MIN, "errors:game.invalidAutoAdvanceDelay")
  .max(AUTO_ADVANCE_DELAY.MAX, "errors:game.invalidAutoAdvanceDelay")

export const gameSettingsSchema = z.object({
  generatedUsernames: z.boolean(),
  answersOnly: z.boolean(),
  autoAdvance: z.object({
    enable: z.boolean(),
    responsesDelay: delayValidator,
    leaderboardDelay: delayValidator,
  }),
})

export const gameSettingsValidator = gameSettingsSchema.partial()
