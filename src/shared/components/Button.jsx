import * as React from "react"
import { cn } from "../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-brand-600 dark:bg-amber-700 text-white hover:bg-brand-700 dark:hover:bg-amber-600 shadow-sm",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline: "border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-800 hover:bg-brand-100 dark:hover:bg-brand-700 text-brand-700 dark:text-brand-200",
    secondary: "bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-brand-100 hover:bg-brand-200 dark:hover:bg-brand-700",
    ghost: "hover:bg-brand-100 dark:hover:bg-brand-800 text-brand-700 dark:text-brand-200",
    link: "text-brand-900 dark:text-brand-300 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return (
    <button
      type={props.type || "button"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
