import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { ListChecks, Users } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["SUMMARY"]
}

const Summary = ({
  data: { subject, totalPlayers, totalQuestions },
}: Props) => {
  const { t } = useTranslation()

  const stats = [
    {
      icon: Users,
      value: totalPlayers,
      label: t("game:summary.participants"),
    },
    {
      icon: ListChecks,
      value: totalQuestions,
      label: t("game:summary.questions"),
    },
  ]

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground font-semibold">
            {t("game:summary.title")}
          </p>

          <h2 className="text-foreground text-center text-3xl leading-tight font-[650] tracking-[-0.01em] wrap-anywhere md:text-[2.4rem]">
            {subject}
          </h2>
        </div>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-4">
        {stats.map(({ icon: Icon, value, label }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 0.15 + index * 0.1,
            }}
            className="bg-card border-border text-foreground flex items-center gap-4 rounded-[10px] border p-5"
          >
            <span className="bg-primary-soft text-primary-soft-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-6" />
            </span>

            <div className="flex flex-col">
              <span className="text-4xl leading-none font-bold tabular-nums">
                {value}
              </span>
              <span className="text-muted-foreground text-sm font-semibold">
                {label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Summary
