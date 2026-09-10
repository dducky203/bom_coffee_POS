import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store'
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react'
import { Button } from '../../shared/components/Button'

const ROLE_DISPLAY = {
  ADMIN: 'Quản trị viên',
  BARTENDER: 'Pha chế (KDS)',
  CASHIER: 'Thu ngân',
  WAITER: 'Phục vụ bàn'
}

export function ForbiddenPage() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)

  const defaultHome = user?.role === 'BARTENDER' ? '/kds' : '/'

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shadow-xl ring-8 ring-red-50 dark:ring-red-950/20 animate-pulse">
          <ShieldAlert size={48} />
        </div>
      </div>

      <h1 className="text-4xl font-black text-brand-900 dark:text-brand-50 tracking-tight mb-2">
        403 - Không có quyền truy cập
      </h1>
      
      <p className="text-base text-brand-600 dark:text-brand-300 max-w-md mb-6 leading-relaxed">
        Rất tiếc, tài khoản của bạn với vai trò <span className="font-bold text-brand-900 dark:text-brand-100 px-2 py-0.5 bg-brand-100 dark:bg-brand-800 rounded-md">{ROLE_DISPLAY[user?.role] || user?.role || 'Khách'}</span> không có quyền truy cập vào trang này.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <Button
          onClick={() => navigate(defaultHome)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-brand-600/20"
        >
          <Home size={18} />
          <span>Về trang chủ của tôi</span>
        </Button>

        <Button
          variant="outline"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold border-brand-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-brand-700"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </div>
  )
}
