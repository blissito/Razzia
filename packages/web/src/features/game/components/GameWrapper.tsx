import { EVENTS, QUIZZ_MODES } from "@razzia/common/constants"
import {
  STATUS,
  type Status,
  type StatusDataMap,
} from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import Loader from "@razzia/web/components/Loader"
import Tooltip from "@razzia/web/components/Tooltip"
import BrandMark, {
  useBrandName,
} from "@razzia/web/features/game/components/BrandMark"
import GameSettingsModal from "@razzia/web/features/game/components/GameSettingsModal"
import RoomLockButton from "@razzia/web/features/game/components/RoomLockButton"
import { FooterSlotContext } from "@razzia/web/features/game/contexts/footer-slot"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useQuestionStore } from "@razzia/web/features/game/stores/question"
import { MANAGER_SKIP_BTN } from "@razzia/web/features/game/utils/constants"
import type { Status as GameStatus } from "@razzia/web/features/game/utils/createStatus"
import { useFullscreen } from "@razzia/web/hooks/useFullscreen"
import clsx from "clsx"
import { Maximize, Minimize, Users } from "lucide-react"
import { type PropsWithChildren, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

type Props = PropsWithChildren & {
  statusName: Status | undefined
  onNext?: () => void
  onBack?: () => void
  manager?: boolean
}

const ICON_BUTTON =
  "bg-card text-foreground border-border hover:bg-muted flex size-9 items-center justify-center rounded-full border"

const subjectOf = (data: unknown): string | null => {
  if (typeof data !== "object" || data === null || !("subject" in data)) {
    return null
  }

  return typeof data.subject === "string" ? data.subject : null
}

const GameWrapper = ({
  children,
  statusName,
  onNext,
  onBack,
  manager,
}: Props) => {
  const { isConnected } = useSocket()
  const { player, gameMode } = usePlayerStore()
  const { players, inviteCode, locked, status } = useManagerStore()
  const { questionStates, setQuestionStates } = useQuestionStore()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { t } = useTranslation()
  const brandName = useBrandName()
  const [skippedStatus, setSkippedStatus] =
    useState<GameStatus<StatusDataMap> | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<{
    seconds: number
    total: number
  } | null>(null)
  const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null)
  const next = statusName ? MANAGER_SKIP_BTN[statusName] : null
  const isDisabled = skippedStatus !== null && skippedStatus === status
  const isLobby = statusName === STATUS.SHOW_ROOM
  const isOver = statusName === STATUS.FINISHED || statusName === STATUS.SUMMARY

  // El tablero se proyecta: escala toda la pantalla con el ancho de la ventana
  useEffect(() => {
    if (!manager) {
      return undefined
    }

    document.documentElement.classList.add("board-scale")

    return () => {
      document.documentElement.classList.remove("board-scale")
    }
  }, [manager])

  useEvent(EVENTS.GAME.UPDATE_QUESTION, ({ current, total }) => {
    setQuestionStates({
      current,
      total,
    })
  })

  useEvent(EVENTS.GAME.TOTAL_PLAYERS, (total) => {
    setTotalPlayers(total)
  })

  useEvent(EVENTS.MANAGER.AUTO_ADVANCE, (state) => {
    setCountdown((current) => {
      if (state === null) {
        return null
      }

      return current ?? state
    })
  })

  useEvent(EVENTS.GAME.ERROR_MESSAGE, (message) => {
    toast.error(t(message))
    console.log(t(message))
    setSkippedStatus(null)
  })

  const handleNext = () => {
    setSkippedStatus(status)
    onNext?.()
  }

  // Renglón de contexto junto a la marca: el tema del quiz o por cuál pregunta va
  const subject = subjectOf(status?.data)
  const questionLine = questionStates
    ? t("game:questionOf", {
        current: questionStates.current,
        total: questionStates.total,
      })
    : null
  const context = [
    statusName === STATUS.SHOW_LEADERBOARD ? t("game:leaderboard") : null,
    subject ?? questionLine,
  ]
    .filter(Boolean)
    .join(" · ")

  if (!isConnected && !statusName) {
    return (
      <section className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4">
        <Loader className="h-20" />
        <h1 className="text-2xl font-semibold">{t("common:connecting")}</h1>
      </section>
    )
  }

  if (!manager) {
    return (
      <section className="bg-background text-foreground flex min-h-dvh flex-col">
        <header className="bg-card border-border flex min-h-13 items-center gap-2.5 border-b px-4">
          <BrandMark />
          <p className="truncate font-semibold">{brandName}</p>
          {questionStates && (
            <span className="border-border text-muted-foreground ml-auto shrink-0 rounded-full border px-2 py-px text-xs font-medium tabular-nums">
              {`${questionStates.current} / ${questionStates.total}`}
            </span>
          )}
        </header>

        <main className="relative flex min-h-0 w-full flex-1 flex-col p-4 sm:mx-auto sm:max-w-3xl">
          {children}
        </main>

        <footer className="bg-card border-border flex items-center justify-between gap-3 border-t px-4 py-2 font-semibold">
          <p className="truncate">{player?.username}</p>
          {gameMode !== QUIZZ_MODES.SURVEY && (
            <span className="bg-muted rounded-full px-3 py-0.5 tabular-nums">
              {player?.points}
            </span>
          )}
        </footer>
      </section>
    )
  }

  return (
    <section className="bg-background text-foreground flex min-h-dvh flex-col px-[1.25rem] py-[1.25rem] md:px-[2.5rem] md:py-[2rem]">
      <header className="text-muted-foreground flex min-h-9 items-center gap-[0.7rem]">
        <BrandMark className="size-[1.7rem]" />
        <p className="text-foreground shrink-0 font-semibold">{brandName}</p>
        {context && <p className="truncate">· {context}</p>}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Tooltip content={t("game:playersJoined")}>
            <span className="bg-primary-soft text-primary-soft-foreground flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums">
              <Users className="size-3.5" />
              {totalPlayers ?? players.length}
            </span>
          </Tooltip>

          {isLobby && <RoomLockButton className={ICON_BUTTON} />}
          {isLobby && <GameSettingsModal />}

          <Tooltip
            content={t(
              isFullscreen ? "common:exitFullscreen" : "common:fullscreen",
            )}
          >
            <button
              onClick={toggleFullscreen}
              aria-label={t(
                isFullscreen ? "common:exitFullscreen" : "common:fullscreen",
              )}
              className={ICON_BUTTON}
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>
          </Tooltip>

          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              {t("common:exit")}
            </Button>
          )}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col py-[1.25rem]">
        <FooterSlotContext value={footerSlot}>{children}</FooterSlotContext>
      </main>

      <footer
        className={clsx("flex items-center gap-3", {
          // Al terminar, sin botón, el podio baja hasta el borde
          "min-h-[3.1rem]": !isOver || (next && onNext),
        })}
      >
        <div ref={setFooterSlot} className="min-w-0 flex-1" />

        {inviteCode && !isLobby && !isOver && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {!locked && (
              <span className="tabular-nums">
                {window.location.host} · {inviteCode}
              </span>
            )}
            <RoomLockButton className={ICON_BUTTON} />
          </div>
        )}

        {next && onNext && (
          <Button
            className={clsx(
              "relative min-h-[3.1rem] overflow-hidden px-[1.55rem] text-[1.05rem]",
              { "pointer-events-none": isDisabled },
            )}
            onClick={handleNext}
          >
            {countdown && (
              <span
                className="timer-fill bg-primary-foreground/20 absolute inset-y-0 left-0"
                style={{
                  animation: `progressBar ${countdown.total}s linear forwards`,
                }}
              />
            )}

            <span className="relative">{t(next)}</span>
          </Button>
        )}
      </footer>
    </section>
  )
}

export default GameWrapper
