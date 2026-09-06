import * as React from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"
import { AlertTriangle, Info } from "lucide-react"

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDestructive = false,
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 rounded-full p-2 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {isDestructive ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>
          <p className="text-brand-700 dark:text-brand-300">
            {message}
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "primary"} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
