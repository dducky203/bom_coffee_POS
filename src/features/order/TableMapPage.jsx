import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tablesQuery } from '../../shared/lib/queries'
import { Coffee, MonitorPlay } from 'lucide-react'
import { LoadingPage } from '../../shared/components/Loading'

export function TableMapPage() {
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()
  const { data: tables = [], isLoading, error } = useQuery(tablesQuery)

  const visible = tables.filter(t => filter === 'ALL' || t.type === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'EMPTY': return 'bg-gray-100 dark:bg-brand-800/40 border-gray-200 dark:border-brand-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-brand-800'
      case 'SERVING': return 'bg-brand-500 border-brand-600 text-white hover:bg-brand-600 shadow-md'
      case 'RESERVED': return 'bg-yellow-500 border-yellow-600 text-white hover:bg-yellow-600 shadow-md'
      default: return 'bg-gray-100'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'EMPTY': return 'Trống'
      case 'SERVING': return 'Đang phục vụ'
      case 'RESERVED': return 'Đặt trước'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Sơ đồ bàn</h1>
          <p className="text-brand-500 dark:text-brand-400">Quản lý trạng thái bàn và order</p>
        </div>

        <div className="flex bg-white dark:bg-brand-800 p-1 rounded-lg border border-brand-200 dark:border-brand-700">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-brand-100 text-brand-800' : 'text-brand-600 hover:bg-brand-50'}`}
            onClick={() => setFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'DRINK' ? 'bg-brand-100 text-brand-800' : 'text-brand-600 hover:bg-brand-50'}`}
            onClick={() => setFilter('DRINK')}
          >
            <Coffee size={16} /> Bàn nước
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'BILLIARD' ? 'bg-brand-100 text-brand-800' : 'text-brand-600 hover:bg-brand-50'}`}
            onClick={() => setFilter('BILLIARD')}
          >
            <MonitorPlay size={16} /> Bàn Bi-a
          </button>
        </div>
      </div>

      {isLoading && <LoadingPage text="Đang tải sơ đồ bàn..." />}
      {error && <p className="text-red-600">{error.message}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {visible.map(table => (
          <button
            key={table.id}
            onClick={() => navigate(`/order/${table.id}`)}
            className={`flex flex-col h-32 rounded-xl border-2 p-4 transition-all duration-200 ${getStatusColor(table.status)}`}
          >
            <div className="flex justify-between w-full mb-auto">
              <span className="font-bold text-lg">{table.name}</span>
              {table.type === 'BILLIARD' ? <MonitorPlay size={20} /> : <Coffee size={20} />}
            </div>
            <div className="flex justify-between w-full items-end mt-2">
              <span className="text-xs font-medium bg-black/10 px-2 py-1 rounded-full">
                {table.capacity} chỗ
              </span>
              <span className="text-sm font-semibold">
                {getStatusLabel(table.status)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
