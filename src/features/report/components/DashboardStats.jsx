import React from 'react'
import { Wallet, ShoppingBag, Users, CupSoda, TrendingUp, DollarSign, Coffee, Flame } from 'lucide-react'

export function StatCard({ title, value, subtext, icon: Icon, accentColor, shadowColor, trend }) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-brand-900 rounded-2xl border border-brand-200/60 dark:border-brand-800 shadow-sm hover:shadow-lg transition-all duration-300 group`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
        <Icon size={80} className="text-brand-900 dark:text-brand-50" />
      </div>
      
      <div className="p-5 sm:p-6 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-lg ${shadowColor}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <h3 className="text-xs font-black text-brand-500 dark:text-brand-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-brand-900 dark:text-brand-50 tracking-tight">
              {value}
            </div>
            {subtext && (
              <div className="text-xs sm:text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                {subtext}
              </div>
            )}
          </div>
          
          {trend && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-xs font-bold">
              <TrendingUp size={14} strokeWidth={3} />
              <span>+{trend}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DashboardStats({ totalRevenueVal, totalOrdersVal, serviceStats, avgOrderValue, formatCurrency }) {
  return (
    <>
    {/* 2. Metric KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard 
          title="TỔNG DOANH THU" 
          value={formatCurrency(totalRevenueVal)} 
          subtext={`Từ ${totalOrdersVal} đơn thanh toán`}
          icon={DollarSign} 
          accentColor="from-amber-600 to-amber-700"
          badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        />
        <StatCard 
          title="DOANH THU ĐỒ UỐNG" 
          value={formatCurrency(serviceStats.drinkRev)} 
          subtext={`Chiếm ${serviceStats.drinkPct}% tổng doanh thu`}
          icon={Coffee} 
          accentColor="from-brand-600 to-brand-700"
          badgeColor="bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-200"
        />
        <StatCard 
          title="DOANH THU GIỜ BI-A" 
          value={formatCurrency(serviceStats.billiardRev)} 
          subtext={`Chiếm ${serviceStats.billiardPct}% tổng doanh thu`}
          icon={Flame} 
          accentColor="from-orange-500 to-orange-700"
          badgeColor="bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
        />
        <StatCard 
          title="ĐƠN HÀNG & AOV" 
          value={`${totalOrdersVal} đơn`} 
          subtext={`TB/Đơn: ${formatCurrency(avgOrderValue)}`}
          icon={ShoppingBag} 
          accentColor="from-teal-600 to-emerald-600"
          badgeColor="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
        />
      </div>
    </>
  )
}
