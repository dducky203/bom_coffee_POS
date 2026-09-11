import * as React from "react"
import { useEffect } from "react"
import { cn } from "../lib/utils"
import { X } from "lucide-react"

export function Modal({ isOpen, onClose, title, children, className, subtitle, footer }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with animation & blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content Card */}
      <div className={cn(
        "relative z-50 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white/95 dark:bg-brand-900/95 border border-brand-200/60 dark:border-brand-700/60 shadow-2xl shadow-brand-950/20 backdrop-blur-xl animate-modal-pop overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100 dark:border-brand-800/80 bg-brand-50/50 dark:bg-brand-850/60 shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1.5 text-brand-400 hover:text-brand-800 dark:hover:text-brand-100 hover:bg-brand-200/50 dark:hover:bg-brand-800 transition-all duration-200 hover:rotate-90 active:scale-95"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Sticky/Fixed Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-brand-100 dark:border-brand-800/80 bg-brand-50/70 dark:bg-brand-850/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

