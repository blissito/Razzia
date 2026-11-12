import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"
import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import AnswerNote from "@razzia/web/features/game/components/AnswerNote"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
  SFX,
} from "@razzia/web/features/game/utils/constants"
import { calculatePercentages } from "@razzia/web/features/game/utils/score"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import clsx from "clsx"
import { useEffect, useState } from "react"
import useSound from "use-sound"

interface Props {
  data: ManagerStatusDataMap["SHOW_RESPONSES"]
}

const Responses = ({ data }: Props) => {
  const { question, answers, responses, solutions, type, note } = data
  const { ResponsesComponent } = QUESTION_REGISTRY[type]
  const percentages = calculatePercentages(responses)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)

  const [sfxResults] = useSound(SFX.RESULTS_SOUND, {
    volume: 0.2,
  })

  const [playMusic, { stop: stopMusic }] = useSound(SFX.ANSWERS.MUSIC, {
    volume: 0.2,
    onplay: () => {
      setIsMusicPlaying(true)
    },
    onend: () => {
      setIsMusicPlaying(false)
    },
  })

  useEffect(() => {
    stopMusic()
    sfxResults()
  }, [responses, playMusic, stopMusic, sfxResults])

  useEffect(() => {
    if (!isMusicPlaying) {
      playMusic()
    }
  }, [isMusicPlaying, playMusic])

  useEffect(() => {
    stopMusic()
  }, [playMusic, stopMusic])

  const title = (
    <h2 className="text-foreground text-[2.4rem] leading-[1.15] font-[650] tracking-[-0.01em] wrap-anywhere">
      {question}
    </h2>
  )

  if (ResponsesComponent) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-[1.1rem]">
        {title}
        <div className="flex flex-1 flex-col justify-center">
          <ResponsesComponent data={data} />
        </div>
        <AnswerNote note={note} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[1.1rem]">
      {title}

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-[0.85rem]">
        {answers.map((answer, key) => (
          <AnswerButton
            key={key}
            className={clsx(ANSWERS_COLORS[key], {
              "opacity-35": solutions && !solutions.includes(key),
            })}
            label={ANSWERS_LABELS[key]}
            correct={solutions ? solutions.includes(key) : undefined}
            count={responses[key] || 0}
            ratio={key in percentages ? percentages[key] : "0%"}
            disabled
          >
            {answer}
          </AnswerButton>
        ))}
      </div>

      <AnswerNote note={note} />
    </div>
  )
}

export default Responses
