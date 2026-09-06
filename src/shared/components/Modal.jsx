import * as React from "react"
import { cn } from "../lib/utils"
import { X } from "lucide-react"

export function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg dark:bg-brand-900 animate-in fade-in zoom-in-95 duration-200",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-900 dark:text-brand-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-brand-500 hover:bg-brand-100 hover:text-brand-900 dark:hover:bg-brand-800 dark:hover:text-brand-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}
