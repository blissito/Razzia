import clsx from "clsx"
import { type PropsWithChildren } from "react"
import { twMerge } from "tailwind-merge"

type Props = {
  className?: string
} & PropsWithChildren

const Card = ({ children, className }: Props) => (
  <div
    className={twMerge(
      clsx(
        "bg-card border-border text-foreground z-10 flex w-full max-w-80 flex-col rounded-[10px] border p-4",
        className,
      ),
    )}
  >
    {children}
  </div>
)

export default Card
