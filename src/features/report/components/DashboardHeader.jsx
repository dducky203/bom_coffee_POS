import React from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'

export function DashboardHeader({
  from, to, preset, setPreset, setCustomFrom, setCustomTo, refetchRevenue, isLoadingAll
}) {
  return (
    <>
      {/* Wrapper for DashboardHeader */}
      {/* 1. Header & Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-brand-900 p-4 sm:p-5 rounded-2xl border border-brand-200/60 dark:border-brand-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-brand-600 to-amber-600 rounded-xl text-white shadow-sm">
              <TrendingUp size={22} />
            </div>
            <span>Báo cáo Doanh thu & Thống kê</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-500 dark:text-brand-400 mt-1.5 flex items-center gap-2">
            <span>Thời gian:</span>
            <span className="font-semibold text-brand-800 dark:text-brand-200 bg-brand-100/70 dark:bg-brand-800 px-2 py-0.5 rounded-md">
              {from}
            </span>
            <span>đến</span>
            <span className="font-semibold text-brand-800 dark:text-brand-200 bg-brand-100/70 dark:bg-brand-800 px-2 py-0.5 rounded-md">
              {to}
            </span>
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-brand-100/70 dark:bg-brand-800 p-1 rounded-xl border border-brand-200/50 dark:border-brand-700">
            <button
              onClick={() => setPreset('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'TODAY'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPreset('LAST_7_DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'LAST_7_DAYS'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setPreset('LAST_30_DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'LAST_30_DAYS'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'THIS_MONTH'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              Tháng này
            </button>
          </div>

          {/* Custom Date Picker Inputs */}
          <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-800/40 p-1 rounded-xl border border-brand-200/60 dark:border-brand-700">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setPreset('CUSTOM')
                setCustomFrom(e.target.value)
              }}
              className="bg-white dark:bg-brand-900 text-xs px-2 py-1 rounded-lg border border-brand-200 dark:border-brand-700 outline-none text-brand-900 dark:text-brand-50 font-medium"
            />
            <span className="text-xs text-brand-400 font-bold">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setPreset('CUSTOM')
                setCustomTo(e.target.value)
              }}
              className="bg-white dark:bg-brand-900 text-xs px-2 py-1 rounded-lg border border-brand-200 dark:border-brand-700 outline-none text-brand-900 dark:text-brand-50 font-medium"
            />
          </div>

          <button
            onClick={() => refetchRevenue()}
            className="p-2 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all active:scale-95 shadow-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={isLoadingAll ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </>
  )
}
