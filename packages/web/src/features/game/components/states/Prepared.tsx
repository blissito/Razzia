import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import PreparedAnswers from "@razzia/web/features/game/components/PreparedAnswers"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["SHOW_PREPARED"]
}

const Prepared = ({
  data: { totalAnswers, questionNumber, questionType },
}: Props) => {
  const { t } = useTranslation()
  const PreparedComponent =
    QUESTION_REGISTRY[questionType].PreparedComponent ?? PreparedAnswers

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      <h2 className="anim-show text-foreground mb-10 text-center text-3xl leading-tight font-[650] tracking-[-0.01em] wrap-anywhere md:text-[2.4rem]">
        {t("game:questionPrefix")}
        {questionNumber}
      </h2>
      <PreparedComponent totalAnswers={totalAnswers} />
    </section>
  )
}

export default Prepared
