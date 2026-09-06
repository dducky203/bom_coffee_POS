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
    <div className="flex h-screen bg-brand-50 dark:bg-brand-900 transition-colors">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white dark:bg-brand-800 border-r border-brand-200 dark:border-brand-700 flex flex-col items-center md:items-stretch py-6 transition-colors">
        <div className="flex items-center justify-center md:justify-start px-6 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            B
          </div>
          <span className="ml-3 font-bold text-xl text-brand-900 dark:text-brand-50 hidden md:block">Bom Coffee</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-3">
          {visibleNavs.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-brand-50' 
                    : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800/50 hover:text-brand-900 dark:hover:text-brand-50'
                }`}
              >
                <item.icon size={24} className="flex-shrink-0" />
                <span className="ml-3 font-medium hidden md:block">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 mt-auto flex flex-col items-center md:items-stretch">
          <div className="mb-4 px-3 hidden md:block">
            <p className="text-sm font-medium text-brand-900 dark:text-brand-50">{user.fullName}</p>
            <p className="text-xs text-brand-500 dark:text-brand-400">{user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
            title="Đăng xuất"
          >
            <LogOut size={24} className="flex-shrink-0" />
            <span className="ml-3 font-medium hidden md:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
