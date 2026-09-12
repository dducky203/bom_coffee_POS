import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tablesQuery } from '../../shared/lib/queries'
import { Coffee, ShoppingBag } from 'lucide-react'
import { LoadingPage } from '../../shared/components/Loading'

const TAKEAWAY_NAME = 'Mang về'

function isTakeawayTable(table) {
  return (table?.name || '').trim().toLowerCase() === TAKEAWAY_NAME.toLowerCase()
}

export function TableMapPage() {
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()
  const { data: tables = [], isLoading, error } = useQuery(tablesQuery)

  const takeawayTable = useMemo(
    () => tables.find(isTakeawayTable),
    [tables]
  )

  const floorTables = useMemo(
    () => tables.filter(t => !isTakeawayTable(t)),
    [tables]
  )

  const stats = useMemo(() => {
    const total = floorTables.length
    const serving = floorTables.filter(t => t.status === 'SERVING').length
    return { total, serving }
  }, [floorTables])

  const visible = useMemo(() => {
    return floorTables.filter(t => filter === 'ALL' || t.type === filter)
  }, [floorTables, filter])

  const showTakeaway = (filter === 'ALL' || filter === 'DRINK') && takeawayTable

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Sơ đồ bàn</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300">
              Đang phục vụ: {stats.serving}/{stats.total} bàn
            </span>
          </div>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-0.5">Quản lý trạng thái bàn và order</p>
        </div>

        <div className="flex bg-white dark:bg-brand-800 p-1 rounded-xl border border-brand-200 dark:border-brand-700 shadow-sm">
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            onClick={() => setFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'DRINK'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            onClick={() => setFilter('DRINK')}
          >
            <Coffee size={14} /> Bàn nước
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'BILLIARD'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            onClick={() => setFilter('BILLIARD')}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-white text-[9px] font-bold text-center leading-[14px]">8</span>
            Bàn Bi-a
          </button>
        </div>
      </div>

      {isLoading && <LoadingPage text="Đang tải sơ đồ bàn..." />}
      {error && <p className="text-red-600 text-sm">{error.message}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {showTakeaway && (
          <button
            type="button"
            onClick={() => navigate(`/order/${takeawayTable.id}`)}
            className={`flex flex-col h-32 rounded-xl p-4 transition-all duration-200 text-left border shadow-sm hover:shadow-md active:scale-[0.98] ${
              takeawayTable.status === 'SERVING'
                ? 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-50 hover:from-emerald-100 hover:to-teal-100'
            }`}
          >
            <div className="flex justify-between items-start w-full mb-auto">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${
                  takeawayTable.status === 'SERVING' ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  Order mang về
                </p>
                <span className="font-bold text-base sm:text-lg tracking-tight">
                  {takeawayTable.name}
                </span>
              </div>
              <ShoppingBag
                size={20}
                className={takeawayTable.status === 'SERVING' ? 'text-white/90' : 'text-emerald-600 dark:text-emerald-400'}
              />
            </div>
            <div className="flex justify-between items-end w-full mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                takeawayTable.status === 'SERVING'
                  ? 'bg-black/20 text-white'
                  : 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              }`}>
                Takeaway
              </span>
              <span className={`text-xs font-semibold ${
                takeawayTable.status === 'SERVING' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {takeawayTable.status === 'SERVING' ? 'Đang có đơn' : 'Tạo đơn mới'}
              </span>
            </div>
          </button>
        )}

        {visible.map(table => {
          const isServing = table.status === 'SERVING'
          const isReserved = table.status === 'RESERVED'
          const isBilliard = table.type === 'BILLIARD'

          return (
            <button
              key={table.id}
              onClick={() => navigate(`/order/${table.id}`)}
              className={`flex flex-col h-32 rounded-xl p-4 transition-all duration-200 text-left border shadow-sm hover:shadow-md active:scale-[0.98] ${
                isServing
                  ? 'bg-brand-600 border-brand-700 text-white hover:bg-brand-700'
                  : isReserved
                  ? 'bg-amber-600 border-amber-700 text-white hover:bg-amber-700'
                  : 'bg-white dark:bg-brand-800/60 border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-50 hover:bg-brand-50/60 dark:hover:bg-brand-800'
              }`}
            >
              <div className="flex justify-between items-start w-full mb-auto">
                <span className="font-bold text-base sm:text-lg tracking-tight">
                  {table.name}
                </span>
                <span className={isServing ? 'text-white/80' : 'text-brand-400'}>
                  {isBilliard ? (
                    <span className="inline-block w-4 h-4 rounded-full bg-zinc-800 text-white text-[10px] font-bold text-center leading-[16px]">8</span>
                  ) : (
                    <Coffee size={18} />
                  )}
                </span>
              </div>

              <div className="flex justify-between items-end w-full mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  isServing
                    ? 'bg-black/20 text-white'
                    : 'bg-brand-100/70 dark:bg-brand-700 text-brand-600 dark:text-brand-300'
                }`}>
                  {table.capacity} chỗ
                </span>
                <span className={`text-xs font-semibold ${
                  isServing ? 'text-white font-bold' : 'text-brand-500 dark:text-brand-400'
                }`}>
                  {isServing ? 'Đang phục vụ' : isReserved ? 'Đặt trước' : 'Trống'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {!showTakeaway && visible.length === 0 && !isLoading && (
        <div className="p-10 text-center bg-white dark:bg-brand-800/40 rounded-xl border border-brand-200 dark:border-brand-700">
          <p className="text-brand-400 text-sm">Chưa có bàn trong danh mục này</p>
        </div>
      )}
    </div>
  )
}
