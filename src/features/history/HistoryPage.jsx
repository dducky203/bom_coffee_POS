import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { historyApi } from '../../shared/lib/api'
import { tablesQuery } from '../../shared/lib/queries'
import { billiardTimeRangeLabel, formatCurrency, orderContentSummary } from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { ChevronLeft, ChevronRight, FileText, RotateCcw, Search } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'

const PAGE_SIZES = [10, 20, 50]
const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n) => subDays(new Date(), n).toISOString().split('T')[0]

const EMPTY_FILTERS = {
  from: today(),
  to: today(),
  tableId: '',
  staffId: '',
  status: '',
  paymentMethod: '',
  tableType: '',
  minAmount: '',
  maxAmount: '',
  hasPreviousOrder: '',
  keyword: '',
  sortBy: 'closedAt',
  sortDir: 'DESC',
}

function statusLabel(status) {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
      return { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' }
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' }
  }
}

function formatPaymentMethodLabel(order) {
  const rawMethod = order?.paymentMethod || (order?.payments && order.payments[0]?.method)
  switch (rawMethod) {
    case 'CASH':
      return { label: 'Tiền mặt', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' }
    case 'BANK_TRANSFER':
    case 'QR':
      return { label: 'CK', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200' }
    case 'CARD':
      return { label: 'Thẻ', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200' }
    case 'EWALLET':
      return { label: 'Ví điện tử', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200' }
    default:
      return { label: rawMethod || 'Tiền mặt', color: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200' }
  }
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages = new Set([0, total - 1, current, current - 1, current + 1])
  return [...pages].filter(p => p >= 0 && p < total).sort((a, b) => a - b)
}

function cleanParams(filters, page, size) {
  const params = { page, size, sortBy: filters.sortBy, sortDir: filters.sortDir }
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null && key !== 'sortBy' && key !== 'sortDir') {
      params[key] = value
    }
  })
  return params
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => (prev.keyword === keywordInput ? prev : { ...prev, keyword: keywordInput }))
      setPage(0)
    }, 400)
    return () => clearTimeout(timer)
  }, [keywordInput])

  const queryParams = useMemo(() => cleanParams(filters, page, size), [filters, page, size])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['order-history', queryParams],
    queryFn: () => historyApi.getOrders(queryParams),
    placeholderData: (prev) => prev,
  })

  const { data: tables = [] } = useQuery(tablesQuery)

  const { data: staffs = [] } = useQuery({
    queryKey: ['history-staffs'],
    queryFn: historyApi.staffs,
  })

  const orders = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0
  const pages = pageNumbers(page, totalPages)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const applyPreset = (from, to) => {
    setFilters(prev => ({ ...prev, from, to }))
    setPage(0)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setKeywordInput('')
    setPage(0)
    setSize(10)
  }

  const inputClass = 'w-full h-10 px-2 sm:px-3 border border-brand-200 dark:border-brand-700 rounded-lg text-xs sm:text-sm bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 outline-none focus:border-brand-500 min-w-0 truncate'

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Lịch sử đơn hàng</h1>
        <p className="text-brand-500 dark:text-brand-400 text-xs sm:text-sm">Lọc theo nhiều trường và xem theo trang</p>
      </div>

      <Card>
        <CardContent className="p-3.5 sm:p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => applyPreset(today(), today())}>Hôm nay</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset(daysAgo(6), today())}>7 ngày</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset(daysAgo(29), today())}>30 ngày</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('', '')}>Tất cả ngày</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Từ ngày</label>
                <input type="date" className={inputClass} value={filters.from} onChange={(e) => handleFilterChange('from', e.target.value)} />
              </div>
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Đến ngày</label>
                <input type="date" className={inputClass} value={filters.to} onChange={(e) => handleFilterChange('to', e.target.value)} />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Bàn</label>
              <select className={inputClass} value={filters.tableId} onChange={(e) => handleFilterChange('tableId', e.target.value)}>
                <option value="">Tất cả bàn</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>{table.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Loại bàn</label>
              <select className={inputClass} value={filters.tableType} onChange={(e) => handleFilterChange('tableType', e.target.value)}>
                <option value="">Tất cả loại</option>
                <option value="DRINK">Bàn nước</option>
                <option value="BILLIARD">Bàn bi-a</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Nhân viên</label>
              <select className={inputClass} value={filters.staffId} onChange={(e) => handleFilterChange('staffId', e.target.value)}>
                <option value="">Tất cả nhân viên</option>
                {staffs.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.fullName || staff.username}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Trạng thái</label>
              <select className={inputClass} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">Tất cả</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Thanh toán</label>
              <select className={inputClass} value={filters.paymentMethod} onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}>
                <option value="">Tất cả phương thức</option>
                <option value="CASH">Tiền mặt</option>
                <option value="QR">QR</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CARD">Thẻ</option>
                <option value="EWALLET">Ví điện tử</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Đơn gọi thêm</label>
              <select className={inputClass} value={filters.hasPreviousOrder} onChange={(e) => handleFilterChange('hasPreviousOrder', e.target.value)}>
                <option value="">Tất cả</option>
                <option value="true">Chỉ đơn gọi thêm</option>
                <option value="false">Không phải gọi thêm</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Từ số tiền</label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={filters.minAmount} onChange={(e) => handleFilterChange('minAmount', e.target.value)} />
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Đến số tiền</label>
              <input type="number" min="0" className={inputClass} placeholder="Không giới hạn" value={filters.maxAmount} onChange={(e) => handleFilterChange('maxAmount', e.target.value)} />
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Sắp xếp</label>
              <select className={inputClass} value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                <option value="closedAt">Thời gian đóng</option>
                <option value="createdAt">Thời gian tạo</option>
                <option value="finalAmount">Tổng tiền</option>
                <option value="id">Mã đơn</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs sm:text-sm font-medium text-brand-700 dark:text-brand-300 block mb-1 truncate">Thứ tự</label>
              <select className={inputClass} value={filters.sortDir} onChange={(e) => handleFilterChange('sortDir', e.target.value)}>
                <option value="DESC">Mới / lớn trước</option>
                <option value="ASC">Cũ / nhỏ trước</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
              <input
                className={`${inputClass} pl-10`}
                placeholder="Tìm mã đơn, tên bàn hoặc nhân viên..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2" onClick={resetFilters}>
              <RotateCcw size={16} />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-brand-600">
        <p>
          {isFetching && !isLoading ? 'Đang lọc...' : `${totalElements} đơn`}
        </p>
        <div className="flex items-center gap-2">
          <span>Mỗi trang</span>
          <select
            className="h-9 px-2 border border-brand-200 rounded-lg bg-white"
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-brand-500 py-10">Đang tải...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-brand-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Không tìm thấy đơn hàng nào</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-50 border-b border-brand-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase">Bàn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase">Nội dung</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase">Thời gian đóng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase">Nhân viên</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase">Thanh toán</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-700 uppercase">Tổng tiền</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {orders.map((order) => {
                    const status = statusLabel(order.status)
                    const payment = formatPaymentMethodLabel(order)
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/history/${order.id}`)}
                        className="hover:bg-brand-50/80 dark:hover:bg-brand-800/60 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-brand-900">
                          #{order.id}
                          {order.previousOrder && (
                            <span className="ml-2 text-[10px] uppercase text-blue-600">gọi thêm</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-700">
                          <p>{order.table?.name || '-'}</p>
                          {order.customerName && (
                            <p className="text-xs text-brand-500 mt-0.5">Chủ bàn: {order.customerName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-700">
                          <p className="font-medium">{orderContentSummary(order)}</p>
                          {billiardTimeRangeLabel(order.billiardSessions) && (
                            <p className="text-xs text-brand-500 mt-0.5">{billiardTimeRangeLabel(order.billiardSessions)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-600">
                          {order.closedAt ? format(new Date(order.closedAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-700">{order.staff?.fullName || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${payment.color}`}>
                            {payment.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-brand-900">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/history/${order.id}`)}>
                            Xem
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Trang {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
            <ChevronLeft size={16} />
          </Button>
          {pages.map((p, index) => {
            const prev = pages[index - 1]
            return (
              <React.Fragment key={p}>
                {prev != null && p - prev > 1 && <span className="px-1 text-brand-400">...</span>}
                <button
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-9 px-2 rounded-lg text-sm border ${
                    p === page ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-brand-200 text-brand-700'
                  }`}
                >
                  {p + 1}
                </button>
              </React.Fragment>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1 || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
