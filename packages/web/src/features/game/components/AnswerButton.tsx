import clsx from "clsx"
import { Check, X } from "lucide-react"
import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type Props = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string
    correct?: boolean
    selected?: boolean
    // "tile": botón grande del jugador (letra arriba, texto abajo).
    // "row": losa del tablero (insignia con la letra y el texto al lado).
    layout?: "row" | "tile"
    // Resultados: cuántos eligieron esta respuesta y qué parte del total son
    count?: number
    ratio?: string
  }

const AnswerButton = ({
  className,
  label,
  children,
  correct,
  selected,
  layout = "row",
  count,
  ratio,
  ...otherProps
}: Props) => {
  const CorrectIcon = correct ? Check : X

  if (layout === "tile") {
    return (
      <button
        className={clsx(
          "relative grid min-h-24 place-items-center rounded-[10px] p-3 text-center transition-transform enabled:active:scale-[0.98]",
          selected && "ring-2 ring-current ring-inset",
          className,
        )}
        {...otherProps}
      >
        <span className="min-w-0">
          <span className="block text-[2.5rem] leading-none font-bold">
            {label}
          </span>
          <span className="mt-2 block text-sm leading-snug font-semibold wrap-anywhere">
            {children}
          </span>
        </span>
        {selected !== undefined && (
          <span
            className={clsx(
              "absolute top-2 right-2 grid size-6 place-items-center rounded-md border-2 border-current",
              selected && "tone-badge",
            )}
          >
            {selected && (
              <b>
                <Check className="size-4 stroke-4" />
              </b>
            )}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      className={clsx(
        "relative flex min-h-[5.25rem] items-center gap-[0.95rem] overflow-hidden rounded-[10px] px-[1.2rem] py-[1.1rem] text-left text-[1.4rem] leading-snug font-semibold",
        className,
      )}
      {...otherProps}
    >
      <span className="tone-badge grid size-[2.35rem] shrink-0 place-items-center rounded-lg text-[1.1rem] leading-none">
        <b>{label}</b>
      </span>
      <span className="min-w-0 flex-1 wrap-anywhere">{children}</span>
      {count !== undefined && (
        <span className="shrink-0 text-[1.6rem] font-bold tabular-nums">
          {count}
        </span>
      )}
      {correct !== undefined && (
        <CorrectIcon className="size-[1.6rem] shrink-0 stroke-3" />
      )}
      {ratio !== undefined && (
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-1.5 bg-current transition-[width] duration-700"
          style={{ width: ratio }}
        />
      )}
    </button>
  )
}

export default AnswerButton
