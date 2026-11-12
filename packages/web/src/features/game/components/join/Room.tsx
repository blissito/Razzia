import Button from "@razzia/web/components/Button"
import PinInput from "@razzia/web/components/PinInput"
import { checkInviteCode } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { ApiError } from "@razzia/web/lib/api"
import { gameBrandingValidator } from "@razzia/common/validators/branding"
import { useMutation } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { type SubmitEvent, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Room = () => {
  const { updatePlayer } = usePlayerStore()
  const [invitation, setInvitation] = useState("")
  const { pin } = useSearch({ from: "/(auth)/" })
  const hasCheckedRef = useRef(false)
  const { t } = useTranslation()

  const { mutate: check, isPending } = useMutation({
    mutationFn: checkInviteCode,
    onSuccess: (
      { generatedUsernames, subject, totalQuestions, branding },
      code,
    ) => {
      const parsed = gameBrandingValidator.safeParse(branding)

      updatePlayer({
        inviteCode: code,
        generatedUsernames,
        joinInfo: {
          subject,
          totalQuestions,
          branding: parsed.success ? parsed.data : null,
        },
      })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )
    },
  })

  const handleJoin = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    check(invitation.replace(/\s/gu, ""))
  }

  useEffect(() => {
    if (!pin || hasCheckedRef.current) {
      return
    }

    hasCheckedRef.current = true
    check(pin)
  }, [pin, check])

  return (
    <form
      onSubmit={handleJoin}
      className="flex w-full max-w-sm flex-col gap-3.5"
    >
      <h1 className="text-foreground text-[1.65rem] leading-[1.15] font-[650]">
        {t("game:pinTitle")}
      </h1>
      <PinInput value={invitation} onChange={setInvitation} />
      <Button type="submit" className="w-full" disabled={isPending}>
        {t("game:enter")}
      </Button>
    </form>
  )
}

export default Room
