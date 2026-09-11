import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../lib/utils"

export function Checkbox({ checked, onChange, label, description, disabled, className }) {
  return (
    <label className={cn(
      "flex items-center gap-3 p-3 rounded-xl border border-brand-200/80 dark:border-brand-700/80 bg-brand-50/50 dark:bg-brand-800/40 hover:bg-brand-100/50 dark:hover:bg-brand-800 cursor-pointer select-none transition-all duration-200 shadow-sm group",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      <div className="relative flex items-center shrink-0">
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-5 h-5 rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-brand-800 peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-700 peer-checked:border-brand-600 dark:peer-checked:border-brand-600 flex items-center justify-center text-white transition-all shadow-sm group-hover:border-brand-400">
          <Check size={13} strokeWidth={3} className={checked ? "block" : "hidden"} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-brand-900 dark:text-brand-50 block truncate">{label}</span>
        {description && (
          <span className="text-[11px] text-brand-500 dark:text-brand-400 block mt-0.5">{description}</span>
        )}
      </div>
    </label>
  )
}
