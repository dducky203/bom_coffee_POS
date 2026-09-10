import * as React from "react"
import { Coffee } from "lucide-react"
import { cn } from "../lib/utils"

// Standalone animated spinner
export function Spinner({ size = "md", className }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  }

  return (
    <div
      className={cn(
        "rounded-full border-brand-200/80 dark:border-brand-700/80 border-t-brand-600 dark:border-t-brand-400 animate-spin shrink-0",
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    />
  )
}

// Full page or container loading screen with coffee pulse animation
export function LoadingPage({ text = "Đang tải dữ liệu...", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px] w-full", className)}>
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 animate-bounce">
          <Coffee size={30} />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-ping" />
      </div>
      <div className="flex items-center gap-2.5">
        <Spinner size="sm" />
        <span className="text-sm font-bold text-brand-700 dark:text-brand-300 animate-pulse">{text}</span>
      </div>
    </div>
  )
}

// Card level loading placeholder
export function LoadingCard({ text = "Đang tải...", className }) {
  return (
    <div className={cn("flex items-center justify-center p-8 bg-white/60 dark:bg-brand-900/60 rounded-2xl border border-brand-200/60 dark:border-brand-800 space-x-3", className)}>
      <Spinner size="md" />
      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{text}</span>
    </div>
  )
}

// Shimmer Skeleton Loader
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-brand-200/60 dark:bg-brand-800/60",
        className
      )}
      {...props}
    />
  )
}
