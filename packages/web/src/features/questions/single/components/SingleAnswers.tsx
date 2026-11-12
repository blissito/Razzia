import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"

const SingleAnswers = ({
  answers,
  onSubmit,
  readOnly,
}: AnswerComponentProps) => {
  const handleSubmit = (key: number) => onSubmit([key])

  return (
    <div
      className={clsx(
        "grid min-h-0 w-full flex-1 auto-rows-fr grid-cols-2",
        readOnly ? "gap-[0.85rem]" : "gap-2.5",
      )}
    >
      {answers.map((answer, key) => (
        <AnswerButton
          key={key}
          className={ANSWERS_COLORS[key]}
          label={ANSWERS_LABELS[key]}
          onClick={() => handleSubmit(key)}
          disabled={readOnly}
          layout={readOnly ? "row" : "tile"}
        >
          {answer}
        </AnswerButton>
      ))}
    </div>
  )
}

export default SingleAnswers
