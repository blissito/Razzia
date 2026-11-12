import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"
import Avatar from "@razzia/web/features/game/components/Avatar"
import Fire from "@razzia/web/features/game/components/icons/Fire"
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  data: ManagerStatusDataMap["SHOW_LEADERBOARD"]
}

const AnimatedPoints = ({ from, to }: { from: number; to: number }) => {
  const spring = useSpring(from, { stiffness: 1000, damping: 30 })
  const display = useTransform(spring, (value) => Math.round(value))
  const [displayValue, setDisplayValue] = useState(from)

  useEffect(() => {
    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display])

  return <>{displayValue}</>
}

const StreakBadge = ({ streak }: { streak: number }) => {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {streak >= 2 && (
        <motion.div
          key="streak"
          initial={{ opacity: 0, scale: 0.5, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: -10 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          role="img"
          aria-label={t("game:streak")}
          className="bg-muted ml-1 flex items-center rounded-full p-1"
        >
          <Fire className="size-[1.2rem]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Leaderboard = ({ data: { oldLeaderboard, leaderboard } }: Props) => {
  const [displayedLeaderboard, setDisplayedLeaderboard] =
    useState(oldLeaderboard)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      setDisplayedLeaderboard(leaderboard)
    }, 1600)

    return () => {
      clearTimeout(timer)
    }
  }, [oldLeaderboard, leaderboard])

  const maxPoints = Math.max(1, ...leaderboard.map((u) => u.points))

  return (
    <section className="mx-auto flex w-full max-w-[64rem] flex-1 flex-col">
      <div className="flex w-full flex-col gap-[0.6rem]">
        <AnimatePresence mode="popLayout">
          {displayedLeaderboard.map(
            ({ id, username, points, streak }, index) => (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 50,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                  },
                }}
                className="bg-card border-border relative grid grid-cols-[1.9rem_2.1rem_1fr_auto] items-center gap-[0.85rem] overflow-hidden rounded-[10px] border px-[1rem] py-[0.7rem]"
              >
                {/* La barra de fondo es el puntaje */}
                <span
                  aria-hidden
                  className="bg-primary-soft absolute inset-y-0 left-0 transition-[width] duration-700"
                  style={{ width: `${(points / maxPoints) * 100}%` }}
                />
                <span className="text-muted-foreground relative text-center font-semibold tabular-nums">
                  {index + 1}
                </span>
                <Avatar
                  name={username}
                  className="relative size-[2.1rem] text-[0.7rem]"
                />
                <span className="text-foreground relative flex min-w-0 items-center text-[1.2rem] font-semibold">
                  <span className="truncate">{username}</span>
                  <StreakBadge streak={streak} />
                </span>
                <span className="text-foreground relative text-[1.2rem] font-[650] tabular-nums">
                  {isAnimating ? (
                    <AnimatedPoints
                      from={
                        oldLeaderboard.find((u) => u.id === id)?.points ?? 0
                      }
                      to={leaderboard.find((u) => u.id === id)?.points ?? 0}
                    />
                  ) : (
                    points
                  )}
                </span>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Leaderboard
