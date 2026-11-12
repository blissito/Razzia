import clsx from "clsx"
import React from "react"

type Props = React.ComponentProps<"input"> & {
  variant?: "sm" | "md"
}

const Input = ({
  className,
  type = "text",
  variant = "md",
  ...otherProps
}: Props) => (
  <input
    type={type}
    className={clsx(
      "focus:border-primary border-border bg-background text-foreground placeholder:text-muted-foreground rounded-[10px] border font-semibold",
      variant === "md" && "p-2 text-lg",
      variant === "sm" && "px-3 py-2 text-sm",
      className,
    )}
    {...otherProps}
  />
)

export default Input
