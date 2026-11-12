import { MEDIA_TYPES } from "@razzia/common/constants"
import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { SFX } from "@razzia/web/features/game/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"

interface Props {
  data: CommonStatusDataMap["SHOW_QUESTION"]
}

const Question = ({ data: { question, media, cooldown } }: Props) => {
  const [sfxShow] = useSound(SFX.SHOW_SOUND, { volume: 0.5 })

  useEffect(() => {
    sfxShow()
  }, [sfxShow])

  return (
    <section className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <h2 className="anim-show text-foreground text-center text-3xl leading-tight font-[650] tracking-[-0.01em] wrap-anywhere md:text-[2.4rem]">
          {question}
        </h2>

        {media?.type === MEDIA_TYPES.IMAGE && (
          <img
            alt={question}
            src={media.url}
            className="max-h-60 w-auto rounded-md sm:max-h-100"
          />
        )}
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="timer-fill bg-primary h-full rounded-full"
          style={{ animation: `progressBar ${cooldown}s linear forwards` }}
        />
      </div>
    </section>
  )
}

export default Question
