import * as React from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"
import { AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react"

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận hành động", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDestructive = false,
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4 py-2">
        <div className="flex items-start gap-4 w-full">
          <div className={`shrink-0 rounded-2xl p-3.5 shadow-sm border transition-all ${
            isDestructive 
              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-900/50 ring-4 ring-red-100/50 dark:ring-red-950/30' 
              : 'bg-brand-50 dark:bg-brand-800/40 text-brand-600 dark:text-brand-300 border-brand-200/80 dark:border-brand-700/50 ring-4 ring-brand-100/50 dark:ring-brand-900/30'
          }`}>
            {isDestructive ? <ShieldAlert size={28} /> : <HelpCircle size={28} />}
          </div>
          <div className="flex-1 self-center">
            <p className="text-sm sm:text-base text-brand-800 dark:text-brand-200 leading-relaxed font-medium whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 w-full pt-4 border-t border-brand-100 dark:border-brand-800">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="rounded-xl px-5 h-11 border-brand-200 text-brand-700 hover:bg-brand-100/60 dark:border-brand-700 dark:text-brand-300 font-medium"
          >
            {cancelText}
          </Button>
          <Button 
            type="button"
            variant={isDestructive ? "destructive" : "primary"} 
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-6 h-11 font-semibold shadow-md active:scale-95 transition-all ${
              isDestructive 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/20' 
                : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white shadow-brand-600/20'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

