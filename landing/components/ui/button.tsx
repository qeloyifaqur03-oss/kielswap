import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

type Variant = "default" | "ghost"
type Size = "default" | "sm"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button"

    const base =
      "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
    const variants: Record<Variant, string> = {
      default: "px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10",
      ghost: "px-3 py-2 bg-transparent hover:bg-white/10 border border-transparent",
    }
    const sizes: Record<Size, string> = {
      default: "h-10",
      sm: "h-9",
    }

    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"


