import React, { useEffect, useState } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './store'
import { getValidToken } from '../shared/lib/api'
import { prefetchCatalog } from '../shared/lib/queries'
import { 
  LogOut, LayoutGrid, Coffee, Clock, PieChart, CupSoda, 
  CircleDollarSign, FileText, Users, Sun, Moon, Sparkles, Shield,
  MoreHorizontal, X
} from 'lucide-react'

const ROLE_DISPLAY = {
  ADMIN: 'Quản trị viên',
  BARTENDER: 'Pha chế (KDS)',
  CASHIER: 'Thu ngân',
  WAITER: 'Phục vụ bàn'
}

export function Layout() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const location = useLocation()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) prefetchCatalog(queryClient)
  }, [user, queryClient])

  // Dark mode state sync
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  if (!user || !getValidToken()) {
    return <Navigate to="/login" replace />
  }

  const navCategories = [
    {
      title: 'BÁN HÀNG & PHỤC VỤ',
      items: [
        { path: '/', label: 'Sơ đồ bàn', icon: LayoutGrid, roles: ['ADMIN', 'WAITER', 'CASHIER'] },
        { path: '/kds', label: 'Pha chế (KDS)', icon: Coffee, roles: ['ADMIN', 'BARTENDER', 'WAITER', 'CASHIER'] },
        { path: '/billiard', label: 'Giờ Bi-a', icon: Clock, roles: ['ADMIN', 'WAITER', 'CASHIER'] },
        { path: '/history', label: 'Lịch sử đơn', icon: FileText, roles: ['ADMIN', 'CASHIER'] },
      ]
    },
    {
      title: 'QUẢN LÝ & BÁO CÁO',
      items: [
        { path: '/dashboard', label: 'Báo cáo doanh thu', icon: PieChart, roles: ['ADMIN'] },
        { path: '/menu', label: 'Món & giá bán', icon: CupSoda, roles: ['ADMIN'] },
        { path: '/pricing', label: 'Giá bàn Bi-a', icon: CircleDollarSign, roles: ['ADMIN'] },
        { path: '/staff', label: 'Quản lý nhân viên', icon: Users, roles: ['ADMIN'] },
      ]
    }
  ]

  // Filter items visible for user role
  const filteredCategories = navCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.roles.includes(user.role))
  })).filter(cat => cat.items.length > 0)

  const allVisibleNavs = filteredCategories.flatMap(cat => cat.items)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const primaryPaths = ['/', '/kds', '/history']
  const primaryNavItems = allVisibleNavs.filter(item => primaryPaths.includes(item.path))
  const secondaryNavItems = allVisibleNavs.filter(item => !primaryPaths.includes(item.path))
  const isSecondaryActive = secondaryNavItems.some(item => location.pathname.startsWith(item.path))

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-50/70 dark:bg-brand-900 transition-colors selection:bg-accent selection:text-white">
      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md border-b border-brand-200/60 dark:border-brand-800 flex items-center justify-between px-4 shrink-0 z-40 shadow-sm print-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-amber-800 flex items-center justify-center text-white font-black shadow-md shadow-brand-700/20">
            <Coffee size={18} />
          </div>
          <div>
            <span className="font-extrabold text-base text-brand-900 dark:text-brand-50 tracking-tight block leading-none">Bom Coffee</span>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">POS System</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button 
            onClick={() => setIsDark(v => !v)}
            className="p-2 rounded-xl text-brand-600 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-800 transition-colors"
            title="Đổi giao diện"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
          
          <div className="h-4 w-px bg-brand-200 dark:bg-brand-700" />

          <button 
            onClick={logout} 
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) & Bottom Navigation Bar (Mobile) */}
      <aside className="order-last md:order-first h-[68px] md:h-auto md:w-20 lg:w-64 w-full bg-white/90 dark:bg-brand-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-r border-brand-200/60 dark:border-brand-800/80 flex md:flex-col items-center md:items-stretch justify-between py-1 md:py-5 px-2 md:px-3 transition-all shrink-0 z-50 shadow-lg md:shadow-none print-hidden">
        
        {/* Desktop Brand Logo Header */}
        <div className="hidden md:flex items-center justify-center lg:justify-start lg:px-3 mb-6 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-amber-800 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-700/30 ring-2 ring-brand-400/20 shrink-0">
            <Coffee size={22} />
          </div>
          <div className="ml-3 hidden lg:block">
            <h1 className="font-black text-lg text-brand-900 dark:text-brand-50 tracking-tight leading-snug">
              Bom Coffee
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400 flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" />
              <span>POS & Quản Lý</span>
            </p>
          </div>
        </div>

        {/* Desktop Theme Toggle Shortcut */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 mb-4 rounded-xl bg-brand-50 dark:bg-brand-800/40 border border-brand-100 dark:border-brand-800">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
            {isDark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
            Giao diện {isDark ? 'Tối' : 'Sáng'}
          </span>
          <button
            type="button"
            onClick={() => setIsDark(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors p-0.5 relative flex items-center ${isDark ? 'bg-brand-600' : 'bg-brand-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Navigation Categories & Links */}
        <nav className="flex-1 flex flex-row md:flex-col gap-1 md:gap-4 px-0 w-full overflow-x-auto hide-scrollbar md:overflow-y-auto custom-scrollbar">
          {/* Desktop Categorized View */}
          <div className="hidden lg:block space-y-4 w-full">
            {filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1.5">
                  {cat.title}
                </p>
                <div className="space-y-1">
                  {cat.items.map(item => {
                    const isActive = item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                          isActive 
                            ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 font-bold scale-[1.02]' 
                            : 'text-brand-700 dark:text-brand-300 hover:bg-brand-100/70 dark:hover:bg-brand-800/80 hover:text-brand-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon size={19} className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="ml-3 truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Tablet (md) Portrait Icon-Only View */}
          <div className="hidden md:flex lg:hidden flex-col gap-2 w-full items-center">
            {allVisibleNavs.map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 scale-105' 
                      : 'text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800'
                  }`}
                >
                  <item.icon size={22} />
                </Link>
              )
            })}
          </div>

          {/* Mobile Bottom Row Nav Links */}
          <div className="flex md:hidden flex-row gap-1 w-full justify-around items-center h-full px-1">
            {primaryNavItems.map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all flex-1 ${
                    isActive 
                      ? 'text-brand-600 dark:text-brand-300 font-bold scale-105' 
                      : 'text-brand-400 hover:text-brand-700 dark:hover:text-brand-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-brand-100 dark:bg-brand-800 shadow-sm' : ''}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-[10px] mt-0.5 truncate max-w-[70px] text-center">{item.label}</span>
                </Link>
              )
            })}

            {/* "Khác" / Sub-Menu Toggle Button */}
            {secondaryNavItems.length > 0 && (
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(v => !v)}
                className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all flex-1 ${
                  isSecondaryActive || isMoreMenuOpen
                    ? 'text-brand-600 dark:text-brand-300 font-bold scale-105' 
                    : 'text-brand-400 hover:text-brand-700 dark:hover:text-brand-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isSecondaryActive || isMoreMenuOpen ? 'bg-brand-100 dark:bg-brand-800 shadow-sm' : ''}`}>
                  <MoreHorizontal size={20} />
                </div>
                <span className="text-[10px] mt-0.5 truncate max-w-[70px] text-center">Khác</span>
              </button>
            )}
          </div>
        </nav>

        {/* User Profile Card & Logout (Desktop Sidebar Footer) */}
        <div className="hidden md:flex flex-col items-stretch pt-4 border-t border-brand-100 dark:border-brand-800 shrink-0">
          <div className="mb-3 px-3 hidden lg:flex items-center gap-3 p-2.5 rounded-xl bg-brand-50/80 dark:bg-brand-800/50 border border-brand-100 dark:border-brand-800">
            <div className="w-9 h-9 rounded-xl bg-brand-200 dark:bg-brand-700 text-brand-800 dark:text-brand-100 font-bold flex items-center justify-center text-sm shrink-0 border border-white/50">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate">{user.fullName}</p>
              <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand-200/60 dark:bg-brand-700 text-brand-700 dark:text-brand-300 mt-0.5">
                {ROLE_DISPLAY[user.role] || user.role}
              </span>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center justify-center lg:justify-start px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all w-full font-medium text-sm group active:scale-95"
            title="Đăng xuất"
          >
            <LogOut size={19} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="ml-3 hidden lg:block">Đăng xuất</span>
          </button>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className={`flex-1 ${location.pathname.startsWith('/kds') ? 'p-2 sm:p-3 md:p-4 overflow-hidden flex flex-col min-h-0' : 'p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar'}`}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Sub-Menu Popup Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* Bottom Sheet Drawer Content */}
          <div className="relative z-50 bg-white dark:bg-brand-900 border-t border-brand-200/80 dark:border-brand-700 rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-modal-pop">
            <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-brand-900 dark:text-brand-50">Danh mục mở rộng</h3>
                  <p className="text-[11px] text-brand-500 dark:text-brand-400">Các tính năng quản lý & báo cáo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 hover:bg-brand-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {secondaryNavItems.map(item => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white border-brand-600 shadow-md scale-[1.02]'
                        : 'bg-brand-50/70 dark:bg-brand-800/60 border-brand-200/70 dark:border-brand-700/80 text-brand-800 dark:text-brand-100 hover:bg-brand-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-brand-700 text-brand-600 dark:text-brand-300 shadow-sm'}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold text-xs leading-tight line-clamp-2">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

