import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
  
  const variants = {
    default: "bg-gradient-to-r from-cyan-400 to-lime-400 text-slate-900 hover:opacity-90 hover:shadow-lg hover:shadow-cyan-400/50 active:scale-95",
    outline: "border-2 border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400/10 hover:shadow-lg hover:shadow-cyan-400/30 active:bg-cyan-400/20",
    secondary: "bg-slate-700 text-slate-50 hover:bg-slate-600 shadow-md hover:shadow-lg",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    link: "text-cyan-400 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-6 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button }
