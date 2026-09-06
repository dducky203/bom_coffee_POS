import React from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { LogOut, LayoutGrid, Coffee, Clock, PieChart, CupSoda, CircleDollarSign, FileText } from 'lucide-react'

export function Layout() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { path: '/', label: 'Sơ đồ bàn', icon: LayoutGrid, roles: ['ADMIN', 'WAITER', 'CASHIER'] },
    { path: '/kds', label: 'Pha chế (KDS)', icon: Coffee, roles: ['ADMIN', 'BARTENDER'] },
    { path: '/billiard', label: 'Giờ Bi-a', icon: Clock, roles: ['ADMIN', 'WAITER', 'CASHIER'] },
    { path: '/history', label: 'Lịch sử', icon: FileText, roles: ['ADMIN', 'CASHIER'] },
    { path: '/dashboard', label: 'Báo cáo', icon: PieChart, roles: ['ADMIN'] },
    { path: '/menu', label: 'Món & giá', icon: CupSoda, roles: ['ADMIN'] },
    { path: '/pricing', label: 'Giá bi-a', icon: CircleDollarSign, roles: ['ADMIN'] },
  ]

  const visibleNavs = navItems.filter(item => item.roles.includes(user.role))

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-50 dark:bg-brand-900 transition-colors">
      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white dark:bg-brand-800 border-b border-brand-200 dark:border-brand-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <span className="font-bold text-brand-900 dark:text-brand-50">Bom Coffee</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-brand-600 dark:text-brand-300">{user.fullName}</span>
          <button onClick={logout} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <aside className="order-last md:order-first h-[70px] md:h-auto md:w-20 lg:w-64 w-full bg-white dark:bg-brand-800 border-t md:border-t-0 md:border-r border-brand-200 dark:border-brand-700 flex md:flex-col items-center md:items-stretch py-2 md:py-6 px-1 md:px-0 transition-colors shrink-0 z-50">
        <div className="hidden md:flex items-center justify-center lg:justify-start lg:px-6 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            B
          </div>
          <span className="ml-3 font-bold text-xl text-brand-900 dark:text-brand-50 hidden lg:block">Bom Coffee</span>
        </div>

        <nav className="flex-1 flex flex-row md:flex-col gap-1 md:gap-2 px-1 md:px-3 w-full overflow-x-auto hide-scrollbar md:overflow-visible">
          {visibleNavs.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-1.5 md:p-3 rounded-lg transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none ${
                  isActive 
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-brand-50' 
                    : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800/50 hover:text-brand-900 dark:hover:text-brand-50'
                }`}
              >
                <item.icon size={22} className="md:w-6 md:h-6 flex-shrink-0 mb-1 md:mb-0" />
                {/* Show label on mobile (under icon) and on large desktop (next to icon), but hide on tablet portrait (md) */}
                <span className="text-[10px] lg:text-base lg:ml-3 font-medium md:hidden lg:block truncate max-w-full text-center lg:text-left">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex lg:px-3 px-1 mt-auto flex-col items-stretch">
          <div className="mb-4 px-3 hidden lg:block">
            <p className="text-sm font-medium text-brand-900 dark:text-brand-50">{user.fullName}</p>
            <p className="text-xs text-brand-500 dark:text-brand-400">{user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center lg:justify-start p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
            title="Đăng xuất"
          >
            <LogOut size={24} className="flex-shrink-0" />
            <span className="ml-3 font-medium hidden lg:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
