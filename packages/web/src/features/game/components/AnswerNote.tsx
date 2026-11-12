import { Lightbulb } from "lucide-react"

interface Props {
  note?: string
}

const AnswerNote = ({ note }: Props) => {
  const text = note?.trim()

  if (!text) {
    return null
  }

  return (
    <div className="w-full">
      <div className="anim-show text-foreground bg-card border-border flex items-start gap-3 rounded-[10px] border px-4 py-3 text-base font-semibold md:text-[1.15rem]">
        <Lightbulb className="text-primary mt-0.5 size-6 shrink-0" />
        <p className="min-w-0 wrap-anywhere whitespace-pre-line">{text}</p>
      </div>
    </div>
  )
}

export default AnswerNote
