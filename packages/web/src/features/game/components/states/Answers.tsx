import { EVENTS, MEDIA_TYPES, NO_TIME_LIMIT } from "@razzia/common/constants"
import type { QuestionMediaType } from "@razzia/common/types/game"
import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import QuestionDialog from "@razzia/web/features/game/components/QuestionDialog"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { SFX } from "@razzia/web/features/game/utils/constants"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import useScreenSize from "@razzia/web/hooks/useScreenSize"
import clsx from "clsx"
import { CircleQuestionMark, Image, Video } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import useSound from "use-sound"

// Tailwind sm breakpoint
const MOBILE_BREAKPOINT = 640

interface Props {
  data: CommonStatusDataMap["SELECT_ANSWER"]
}

const Answers = ({
  data: {
    question,
    answers,
    media,
    time,
    totalPlayer,
    questionType,
    options,
    answersOnly,
  },
}: Props) => {
  const { socket } = useSocket()
  const { player, gameId } = usePlayerStore()

  const [cooldown, setCooldown] = useState(time)
  const [totalAnswer, setTotalAnswer] = useState(0)
  const { t } = useTranslation()
  const { width } = useScreenSize()

  const popupMedia: QuestionMediaType[] = [MEDIA_TYPES.IMAGE, MEDIA_TYPES.VIDEO]
  const isPopupMedia = popupMedia.includes(media?.type)
  const showAnswersOnly = Boolean(player) && answersOnly
  const showMediaInPopup =
    Boolean(player) && width < MOBILE_BREAKPOINT && isPopupMedia

  const [sfxPop] = useSound(SFX.ANSWERS.SOUND, {
    volume: 0.1,
  })

  const [playMusic, { stop: stopMusic }] = useSound(SFX.ANSWERS.MUSIC, {
    volume: 0.2,
    interrupt: true,
    loop: true,
  })

  const handleSubmit = (answerKeys: number[]) => {
    if (!player || !gameId) {
      return
    }

    socket.emit(EVENTS.PLAYER.SELECTED_ANSWER, {
      gameId,
      data: {
        answerKeys,
      },
    })
    sfxPop()
  }

  useEffect(() => {
    const disabledMusicMedia: QuestionMediaType[] = [
      MEDIA_TYPES.AUDIO,
      MEDIA_TYPES.VIDEO,
    ]

    if (disabledMusicMedia.includes(media?.type)) {
      return
    }

    playMusic()

    return () => {
      stopMusic()
    }
    // oxlint-disable-next-line
  }, [playMusic])

  useEvent(EVENTS.GAME.COOLDOWN, (sec) => {
    setCooldown(sec)
  })

  useEvent(EVENTS.GAME.PLAYER_ANSWER, (count) => {
    setTotalAnswer(count)
    sfxPop()
  })

  const { AnswerComponent } = QUESTION_REGISTRY[questionType]

  const MediaIcon = media?.type === MEDIA_TYPES.VIDEO ? Video : Image

  const isBoard = !player
  const timeLeft = time > 0 ? Math.max(0, Math.min(1, cooldown / time)) : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 md:gap-[1.1rem]">
      {showAnswersOnly ? (
        <>
          <QuestionDialog
            question={question}
            media={isPopupMedia ? media : undefined}
            label={t("game:question.show")}
            className="bg-card text-foreground border-border hover:bg-muted flex min-h-9 items-center gap-2 self-end rounded-full border px-3 text-sm font-semibold"
            showQuestion
          >
            <CircleQuestionMark className="size-4" />
            {t("game:question.show")}
          </QuestionDialog>

          {media?.type === MEDIA_TYPES.AUDIO && (
            <div className="flex justify-center">
              <QuestionMedia media={media} alt={question} />
            </div>
          )}
        </>
      ) : (
        <>
          <h2
            className={clsx(
              "text-foreground wrap-anywhere",
              isBoard
                ? "text-[2.4rem] leading-[1.15] font-[650] tracking-[-0.01em]"
                : "text-[1.2rem] leading-tight font-semibold",
            )}
          >
            {question}
          </h2>

          {showMediaInPopup ? (
            <QuestionDialog
              question={question}
              media={media}
              className="bg-card text-foreground border-border hover:bg-muted flex min-h-9 items-center gap-2 self-start rounded-full border px-3 text-sm font-semibold"
            >
              <MediaIcon className="size-4" />
              {t(
                media?.type === MEDIA_TYPES.VIDEO
                  ? "game:media.showVideo"
                  : "game:media.showImage",
              )}
            </QuestionDialog>
          ) : (
            media && (
              <div className="flex justify-center">
                <QuestionMedia media={media} alt={question} />
              </div>
            )
          )}
        </>
      )}

      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        {time !== NO_TIME_LIMIT && (
          <>
            <div
              role="timer"
              aria-label={t("game:hud.time")}
              className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full"
            >
              <div
                className="timer-fill bg-primary h-full rounded-full"
                style={{ width: `${timeLeft * 100}%` }}
              />
            </div>
            <span className="text-foreground w-[2ch] text-right font-semibold tabular-nums">
              {cooldown}
            </span>
          </>
        )}
        <span className="ml-auto tabular-nums">
          {t("game:answeredCount", {
            answered: totalAnswer,
            total: totalPlayer,
          })}
        </span>
      </div>

      <AnswerComponent
        answers={answers}
        options={options}
        onSubmit={handleSubmit}
        readOnly={isBoard}
        fill={showAnswersOnly}
      />
    </div>
  )
}

export default Answers
