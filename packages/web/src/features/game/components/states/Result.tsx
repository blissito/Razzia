import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { SFX } from "@razzia/web/features/game/utils/constants"
import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import useSound from "use-sound"

interface Props {
  data: CommonStatusDataMap["SHOW_RESULT"]
}

const Result = ({
  data: { correct, message, points, myPoints, rank, aheadOfMe },
}: Props) => {
  const { updatePlayer } = usePlayerStore()
  const { t } = useTranslation()

  const [sfxResults] = useSound(SFX.RESULTS_SOUND, {
    volume: 0.2,
  })

  useEffect(() => {
    updatePlayer(({ player }) => ({ player: { ...player, points: myPoints } }))

    sfxResults()
    // oxlint-disable-next-line
  }, [sfxResults])

  const Icon = correct ? Check : X

  return (
    <section className="anim-show mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2.5 text-center">
      <span
        className={clsx(
          "text-background grid size-18 place-items-center rounded-full",
          correct ? "bg-correct" : "bg-danger",
        )}
      >
        <Icon className="size-9 stroke-3" />
      </span>
      <h2 className="text-foreground text-[1.65rem] font-[650]">
        {t(message)}
      </h2>
      {correct && (
        <p className="text-foreground text-[2.5rem] leading-none font-bold tabular-nums">
          +{points}
        </p>
      )}
      <p className="text-muted-foreground">
        {t("game:resultTop")}
        {t("game:rank", { count: rank, ordinal: true })}
        {aheadOfMe ? `${t("game:resultBehind")}${aheadOfMe}` : ""}
        {` · ${myPoints} pts`}
      </p>
    </section>
  )
}

export default Result
