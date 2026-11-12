import clsx from "clsx"

const TONES = ["tone-1", "tone-2", "tone-3", "tone-4"]

const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")

// El mismo nombre siempre cae en el mismo tono
const toneOf = (name: string) =>
  TONES[
    Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      TONES.length
  ]

interface Props {
  name: string
  className?: string
}

const Avatar = ({ name, className }: Props) => (
  <span
    aria-hidden
    className={clsx(
      "grid shrink-0 place-items-center rounded-full font-semibold",
      toneOf(name),
      className,
    )}
  >
    {initialsOf(name)}
  </span>
)

export default Avatar
