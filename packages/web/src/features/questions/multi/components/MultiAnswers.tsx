import Button from "@razzia/web/components/Button"
import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const MultiAnswers = ({
  answers,
  onSubmit,
  readOnly,
}: AnswerComponentProps) => {
  const [selected, setSelected] = useState<number[]>([])
  const { t } = useTranslation()

  const handleSubmit = () => onSubmit(selected)

  const toggle = (key: number) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div
        className={clsx(
          "grid min-h-0 flex-1 auto-rows-fr grid-cols-2",
          readOnly ? "gap-[0.85rem]" : "gap-2.5",
        )}
      >
        {answers.map((answer, key) => {
          const isSelected = selected.includes(key)

          return (
            <AnswerButton
              key={key}
              className={ANSWERS_COLORS[key]}
              label={ANSWERS_LABELS[key]}
              onClick={() => toggle(key)}
              selected={readOnly ? undefined : isSelected}
              disabled={readOnly}
              layout={readOnly ? "row" : "tile"}
            >
              {answer}
            </AnswerButton>
          )
        })}
      </div>
      {!readOnly && (
        <Button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full"
        >
          {t("game:confirm")}
        </Button>
      )}
    </div>
  )
}

export default MultiAnswers
