import { useBranding } from "@razzia/web/branding"
import clsx from "clsx"

const DEFAULT_NAME = "Razzia"

const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")

export const useBrandName = () => useBranding()?.appName ?? DEFAULT_NAME

interface Props {
  className?: string
}

// Logo de la marca; sin logo, un cuadrito con sus iniciales
const BrandMark = ({ className }: Props) => {
  const logo = useBranding()?.logo
  const name = useBrandName()

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className={clsx("size-6 shrink-0 rounded-md object-contain", className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={clsx(
        "bg-primary text-primary-foreground grid size-6 shrink-0 place-items-center rounded-md font-mono text-[0.7rem] leading-none font-bold",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

export default BrandMark
