import * as React from "react"
import { cn } from "../lib/utils"

export function Toggle({ checked, onChange, label, description, disabled, className }) {
  return (
    <label className={cn(
      "flex items-center justify-between gap-3 p-3 rounded-xl border border-brand-200/80 dark:border-brand-700/80 bg-brand-50/50 dark:bg-brand-800/40 hover:bg-brand-100/50 dark:hover:bg-brand-800 cursor-pointer select-none transition-all duration-200 shadow-sm",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-brand-900 dark:text-brand-50 block truncate">{label}</span>
        {description && (
          <span className="text-[11px] text-brand-500 dark:text-brand-400 block mt-0.5">{description}</span>
        )}
      </div>

      <div className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-brand-200 dark:bg-brand-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-700 shadow-inner" />
      </div>
    </label>
  )
}
