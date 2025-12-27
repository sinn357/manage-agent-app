import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-violet text-white shadow-md hover:shadow-lg hover:from-primary-hover hover:to-violet-hover",
        secondary:
          "border-2 border-primary text-primary bg-transparent shadow-sm hover:bg-gradient-to-r hover:from-primary hover:to-violet hover:text-white hover:border-transparent",
        success:
          "bg-gradient-to-r from-success to-success-light text-white shadow-md hover:shadow-lg hover:from-success-dark hover:to-success",
        warning:
          "bg-gradient-to-r from-warning to-warning-light text-white shadow-md hover:shadow-lg hover:from-warning-dark hover:to-warning",
        danger:
          "bg-gradient-to-r from-danger to-danger-light text-white shadow-md hover:shadow-lg hover:from-danger-dark hover:to-danger",
        outline:
          "border border-border bg-background text-foreground shadow-sm hover:bg-surface hover:border-primary hover:text-primary",
        ghost:
          "text-foreground-secondary hover:bg-surface hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
