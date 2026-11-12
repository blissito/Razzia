import type { PlayerStatusDataMap } from "@razzia/common/types/game/status"
import Loader from "@razzia/web/components/Loader"
import { useTranslation } from "react-i18next"

interface Props {
  data: PlayerStatusDataMap["WAIT"]
}

const Wait = ({ data: { text } }: Props) => {
  const { t } = useTranslation()

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      <Loader className="h-16" />
      <h2 className="text-foreground mt-5 text-center text-2xl leading-tight font-[650] md:text-3xl">
        {t(text)}
      </h2>
    </section>
  )
}

export default Wait
