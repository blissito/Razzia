import { EVENTS } from "@razzia/common/constants"
import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { useEvent } from "@razzia/web/features/game/contexts/socket-context"
import { SFX } from "@razzia/web/features/game/utils/constants"
import clsx from "clsx"
import { useState } from "react"
import useSound from "use-sound"

interface Props {
  data: CommonStatusDataMap["SHOW_START"]
}

const Start = ({ data: { time, subject } }: Props) => {
  const [showTitle, setShowTitle] = useState(true)
  const [cooldown, setCooldown] = useState(time)

  const [sfxBoump] = useSound(SFX.BOUMP_SOUND, {
    volume: 0.2,
  })

  useEvent(EVENTS.GAME.START_COOLDOWN, () => {
    sfxBoump()
    setShowTitle(false)
  })

  useEvent(EVENTS.GAME.COOLDOWN, (sec) => {
    sfxBoump()
    setCooldown(sec)
  })

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      {showTitle ? (
        <h2 className="anim-show text-foreground text-center text-3xl leading-tight font-[650] tracking-[-0.01em] wrap-anywhere md:text-[2.4rem]">
          {subject}
        </h2>
      ) : (
        <>
          <div
            className={clsx(
              `anim-show bg-primary aspect-square h-32 rounded-[10px] transition-all md:h-[13rem]`,
            )}
            style={{
              transform: `rotate(${45 * (time - cooldown)}deg)`,
            }}
          ></div>
          <span className="text-primary-foreground absolute text-6xl font-bold tabular-nums md:text-[6rem]">
            {cooldown}
          </span>
        </>
      )}
    </section>
  )
}

export default Start
