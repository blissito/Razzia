import { AUTO_ADVANCE_DELAY } from "@razzia/common/constants"
import {
  inviteCodeValidator,
  usernameValidator,
} from "@razzia/common/validators/auth"
import { gameBrandingValidator } from "@razzia/common/validators/branding"
import { quizzValidator } from "@razzia/common/validators/quizz"
import z from "zod"

const MAX_INLINE_QUESTIONS = 100

// Tope por campo de un quiz en línea, para que una partida no cargue textos enormes en memoria.
const INLINE_LIMITS = {
  subject: 200,
  question: 1000,
  answer: 300,
  note: 2000,
  category: 100,
  mediaUrl: 2048,
} as const

// El quiz viaja en la petición y vive sólo en memoria, mientras dura la partida.
export const inlineQuizzValidator = quizzValidator.superRefine((quizz, ctx) => {
  const tooLong = (path: Array<string | number>) =>
    ctx.addIssue({ code: "custom", path, message: "errors:invalidRequest" })

  if (quizz.subject.length > INLINE_LIMITS.subject) {
    tooLong(["subject"])
  }

  if (quizz.questions.length > MAX_INLINE_QUESTIONS) {
    tooLong(["questions"])
  }

  quizz.questions.forEach((question, index) => {
    const fields: Array<[string, string | undefined, number]> = [
      ["question", question.question, INLINE_LIMITS.question],
      ["note", question.note, INLINE_LIMITS.note],
      ["category", question.category, INLINE_LIMITS.category],
      ["media", question.media?.url, INLINE_LIMITS.mediaUrl],
    ]

    fields.forEach(([name, value, max]) => {
      if (value !== undefined && value.length > max) {
        tooLong(["questions", index, name])
      }
    })

    if (question.answers.some((a) => a.length > INLINE_LIMITS.answer)) {
      tooLong(["questions", index, "answers"])
    }
  })
})

export const tenantValidator = z
  .string()
  .max(64, "errors:invalidRequest")
  .regex(/^[\w-]+$/u, "errors:invalidRequest")

export const createGameValidator = z
  .object({
    quizzId: z.string().min(1, "errors:quizz.notFound").optional(),
    // Alternativa a quizzId: el quiz completo, que no se guarda en la instancia
    quizz: inlineQuizzValidator.optional(),
    // Members-only game: every join needs a signed identity (needs IDENTITY_SECRET)
    requireIdentity: z.boolean().optional(),
    // Etiqueta opaca de la app anfitriona; se guarda con el resultado
    tenant: tenantValidator.optional(),
    branding: gameBrandingValidator.optional(),
  })
  .refine(
    (body) => (body.quizzId === undefined) !== (body.quizz === undefined),
    { path: ["quizzId"], message: "errors:quizz.notFound" },
  )

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
