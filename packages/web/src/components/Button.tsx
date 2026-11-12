import clsx from "clsx"
import type { ButtonHTMLAttributes, PropsWithChildren } from "react"
import { twMerge } from "tailwind-merge"

type Size = "sm" | "md" | "lg"
type Variant = "primary" | "ghost"

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  PropsWithChildren & {
    size?: Size
    // Un solo botón lleno por pantalla; los demás van en `ghost`
    variant?: Variant
    classNameContent?: string
  }

const sizeClasses: Record<Size, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-12 px-6 text-lg",
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground enabled:hover:brightness-105 enabled:active:brightness-95",
  ghost: "bg-card text-foreground border-border enabled:hover:bg-muted border",
}

const Button = ({
  children,
  className,
  classNameContent,
  size = "md",
  variant = "primary",
  ...otherProps
}: Props) => (
  <button
    className={twMerge(
      clsx(
        "rounded-full font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ),
    )}
    {...otherProps}
  >
    <div
      className={twMerge(
        clsx("flex items-center justify-center gap-2", classNameContent),
      )}
    >
      {children}
    </div>
  </button>
)

export default Button
