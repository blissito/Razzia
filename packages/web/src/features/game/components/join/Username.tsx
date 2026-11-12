import { STATUS } from "@razzia/common/types/game/status"
import { applyGameBranding, rememberGameBranding } from "@razzia/web/branding"
import Button from "@razzia/web/components/Button"
import Input from "@razzia/web/components/Input"
import { joinGame } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { createStatus } from "@razzia/web/features/game/utils/createStatus"
import { ApiError } from "@razzia/web/lib/api"
import { safeSet } from "@razzia/web/lib/storage"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { StatusCodes } from "http-status-codes"
import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Username = () => {
  const { inviteCode, generatedUsernames, joinInfo, updatePlayer } =
    usePlayerStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const { name: presetName, id: identity } = useSearch({ from: "/(auth)/" })
  const hasAutoJoinedRef = useRef(false)
  const { t } = useTranslation()

  const { mutate: join, isPending } = useMutation({
    mutationFn: joinGame,
    onSuccess: ({ gameId, ticket, username: name }) => {
      safeSet("game_id", gameId)

      if (joinInfo?.branding) {
        rememberGameBranding(gameId, joinInfo.branding)
      }

      if (inviteCode) {
        safeSet("game_pin", inviteCode)
      }

      updatePlayer({
        gameId,
        joinTicket: ticket,
        player: name ? { username: name, points: 0 } : null,
        status: createStatus(STATUS.WAIT, { text: "game:waitingForPlayers" }),
      })
      navigate({ to: "/party/$gameId", params: { gameId } })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )

      if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
        updatePlayer({
          inviteCode: null,
          generatedUsernames: false,
          joinInfo: null,
        })
      }
    },
  })

  // La pantalla de nombre ya lleva la marca de la partida
  const joinBranding = joinInfo?.branding

  useLayoutEffect(
    () => (joinBranding ? applyGameBranding(joinBranding) : undefined),
    [joinBranding],
  )

  const handleLogin = () => {
    if (!inviteCode) {
      return
    }

    join({
      inviteCode,
      username: generatedUsernames ? undefined : username,
      identity,
    })
  }

  useEffect(() => {
    if (!presetName || !inviteCode || hasAutoJoinedRef.current) {
      return
    }

    hasAutoJoinedRef.current = true
    join({
      inviteCode,
      username: generatedUsernames ? undefined : presetName,
      identity,
    })
  }, [presetName, identity, inviteCode, generatedUsernames, join])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }

  const quizLine = joinInfo && (
    <p className="text-muted-foreground text-sm">
      {joinInfo.subject} · {joinInfo.totalQuestions}{" "}
      {t("game:summary.questions").toLowerCase()}
    </p>
  )

  if (generatedUsernames) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3.5">
        <h1 className="text-foreground text-2xl leading-[1.15] font-[650]">
          {t("game:generatedUsernameNotice")}
        </h1>
        <Button className="w-full" onClick={handleLogin} disabled={isPending}>
          {t("game:enter")}
        </Button>
        {quizLine}
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3.5">
      <h1 className="text-foreground text-2xl leading-[1.15] font-[650]">
        <label htmlFor="username">{t("game:usernameTitle")}</label>
      </h1>
      <Input
        id="username"
        className="w-full px-3.5 py-3.5 font-normal"
        maxLength={24}
        autoComplete="nickname"
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("game:usernamePlaceholder")}
      />
      <Button className="w-full" onClick={handleLogin} disabled={isPending}>
        {t("game:enter")}
      </Button>
      {quizLine}
    </div>
  )
}

export default Username
