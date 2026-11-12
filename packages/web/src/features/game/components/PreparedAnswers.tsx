import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { PreparedComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"

const PreparedAnswers = ({ totalAnswers }: PreparedComponentProps) => (
  <div className="anim-quizz grid w-56 grid-cols-2 gap-3">
    {Array.from({ length: totalAnswers }).map((_, key) => (
      <div
        key={key}
        className={clsx(
          "grid aspect-square place-items-center rounded-[10px] text-4xl font-bold",
          ANSWERS_COLORS[key],
        )}
      >
        {ANSWERS_LABELS[key]}
      </div>
    ))}
  </div>
)

export default PreparedAnswers
