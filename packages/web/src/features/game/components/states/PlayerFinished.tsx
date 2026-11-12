import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["FINISHED"]
}

const PlayerFinished = ({ data: { rank, subject } }: Props) => {
  const { player } = usePlayerStore()
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-muted-foreground wrap-anywhere">{subject}</p>

      <p className="text-foreground text-[2.5rem] leading-none font-bold">
        {typeof rank === "number"
          ? t("game:rank", { count: rank, ordinal: true })
          : "—"}
      </p>

      <p className="bg-card border-border text-foreground mt-2 w-full rounded-[10px] border px-6 py-4 text-2xl font-[650] tabular-nums">
        {player?.points ?? 0} pts
      </p>
    </div>
  )
}

export default PlayerFinished
