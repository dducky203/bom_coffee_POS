import { ChevronLeft, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function OrderHeader({ table, customerName, cartItemCount, isDesktopCartVisible, setIsDesktopCartVisible }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between gap-4 mb-4 shrink-0 pt-2 lg:pt-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-xl text-brand-600 dark:text-brand-300 transition-colors"
          title="Quay lại danh sách bàn"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight">Order - {table?.name || 'Bàn'}</h1>
          <p className="text-brand-500 dark:text-brand-400 text-xs">
            {customerName?.trim() ? `Chủ bàn: ${customerName.trim()}` : 'Chọn món thêm vào giỏ order'}
          </p>
        </div>
      </div>

      {/* Desktop Cart Toggle Button */}
      <button
        type="button"
        onClick={() => setIsDesktopCartVisible(!isDesktopCartVisible)}
        className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-800 border border-brand-200/80 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700/80 shadow-sm transition-all text-xs font-bold"
      >
        {isDesktopCartVisible ? (
          <>
            <PanelRightClose size={18} className="text-brand-600 dark:text-brand-400" />
            <span>Ẩn giỏ hàng</span>
          </>
        ) : (
          <>
            <PanelRightOpen size={18} className="text-brand-600 dark:text-brand-400" />
            <span>Hiện giỏ hàng ({cartItemCount})</span>
            {cartItemCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            )}
          </>
        )}
      </button>
    </div>
  )
}
