import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../lib/utils'

export function Select({ value, onChange, options = [], placeholder = "Chọn...", disabled, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find(o => String(o.value) === String(value))

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={cn(
          "w-full h-11 px-4 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 text-sm font-medium flex items-center justify-between transition-all outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm",
          isOpen && "border-brand-500 ring-2 ring-brand-500/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-brand-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={cn("text-brand-400 transition-transform duration-200 shrink-0 ml-2", isOpen && "rotate-180 text-brand-600")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[100] bg-white/95 dark:bg-brand-900/95 backdrop-blur-xl border border-brand-200 dark:border-brand-700/80 rounded-2xl shadow-2xl p-1.5 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar animate-modal-pop">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange?.(opt.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all flex items-center justify-between select-none",
                  isSelected
                    ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold shadow-sm"
                    : "text-brand-800 dark:text-brand-200 hover:bg-brand-100/70 dark:hover:bg-brand-800/80"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={16} strokeWidth={3} className="shrink-0 ml-2 text-white" />}
              </div>
            )
          })}
          {options.length === 0 && (
            <p className="text-xs text-brand-400 text-center py-3">Chưa có tùy chọn</p>
          )}
        </div>
      )}
    </div>
  )
}
