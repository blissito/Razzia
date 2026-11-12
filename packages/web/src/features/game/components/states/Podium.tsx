import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"
import Avatar from "@razzia/web/features/game/components/Avatar"
import { SFX } from "@razzia/web/features/game/utils/constants"
import useScreenSize from "@razzia/web/hooks/useScreenSize"
import clsx from "clsx"
import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import useSound from "use-sound"

interface Props {
  data: ManagerStatusDataMap["FINISHED"]
}

const SUSPENSE_MIN_PLAYERS = 3

const usePodiumAnimation = (topLength: number) => {
  const hasSuspense = topLength >= SUSPENSE_MIN_PLAYERS
  const [apparition, setApparition] = useState(() => (hasSuspense ? 0 : 4))

  const [sfxtThree] = useSound(SFX.PODIUM.THREE, { volume: 0.1 })
  const [sfxSecond] = useSound(SFX.PODIUM.SECOND, { volume: 0.1 })
  const [sfxRool, { stop: sfxRoolStop }] = useSound(SFX.PODIUM.SNEAR_ROOL, {
    volume: 0.1,
  })
  const [sfxFirst] = useSound(SFX.PODIUM.FIRST, { volume: 0.1 })

  useEffect(() => {
    const actions: Partial<Record<number, () => void>> = {
      4: () => {
        sfxRoolStop()
        sfxFirst()
      },
      3: sfxRool,
      2: sfxSecond,
      1: sfxtThree,
    }

    actions[apparition]?.()
  }, [apparition, sfxFirst, sfxSecond, sfxtThree, sfxRool, sfxRoolStop])

  useEffect(() => {
    if (apparition >= 4) {
      return
    }

    const interval = setInterval(() => {
      setApparition((value) => value + 1)
    }, 2000)

    return () => clearInterval(interval)
  }, [apparition, topLength])

  return { apparition }
}

const STEPS = [
  { rank: 2, visibleFrom: 2, height: "h-[10.4rem]" },
  { rank: 1, visibleFrom: 3, height: "h-[14.6rem]" },
  { rank: 3, visibleFrom: 1, height: "h-[7.6rem]" },
]

const CONFETTI_VARIABLES = [
  "--color-primary",
  "--color-answer-1",
  "--color-answer-2",
  "--color-answer-3",
  "--color-answer-4",
]

// El confeti lleva los colores de la marca; con movimiento reducido no sale
const useConfetti = () => {
  const [confetti] = useState(() => {
    const styles = getComputedStyle(document.documentElement)

    return {
      enabled: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      colors: CONFETTI_VARIABLES.map((name) =>
        styles.getPropertyValue(name).trim(),
      ).filter(Boolean),
    }
  })

  return confetti
}

const Podium = ({ data: { top } }: Props) => {
  const { apparition } = usePodiumAnimation(top.length)
  const { width, height } = useScreenSize()
  const confetti = useConfetti()

  return (
    <>
      {apparition >= 4 && confetti.enabled && (
        <ReactConfetti
          width={width}
          height={height}
          colors={confetti.colors}
          className="pointer-events-none fixed inset-0 z-40 h-full w-full"
        />
      )}

      <section className="-mb-[1.25rem] flex min-h-0 flex-1 items-end justify-center gap-[1rem] overflow-hidden">
        {STEPS.map(({ rank, visibleFrom, height: stepHeight }) => {
          const entry = top.at(rank - 1)

          if (!entry) {
            return null
          }

          const isFirst = rank === 1
          // El nombre del primer lugar se guarda hasta el redoble final
          const showName = !isFirst || apparition >= 4

          return (
            <div
              key={rank}
              className={clsx(
                "w-[13.2rem] max-w-[32%] min-w-0 translate-y-full text-center opacity-0 transition-all duration-500",
                { "translate-y-0! opacity-100": apparition >= visibleFrom },
              )}
            >
              <div
                className={clsx("transition-opacity", {
                  "opacity-0": !showName,
                  "anim-balanced": apparition >= 4,
                })}
              >
                <Avatar
                  name={entry.username}
                  className="mx-auto mb-[0.55rem] size-[3.9rem] text-[1.3rem]"
                />
                <p className="text-foreground truncate text-[1.25rem] font-[650]">
                  {entry.username}
                </p>
                <p className="text-muted-foreground text-[0.9rem] tabular-nums">
                  {entry.points} pts
                </p>
              </div>
              <div
                className={clsx(
                  "mt-[0.7rem] grid place-items-start justify-center rounded-t-[10px] border border-b-0 pt-[1rem] text-[2.8rem] leading-none font-bold",
                  stepHeight,
                  isFirst
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground",
                )}
              >
                {rank}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}

export default Podium
