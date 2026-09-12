import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { historyApi } from '../../shared/lib/api'
import {
  drinkAmountOf,
  drinkCountOf,
  durationSecondsBetween,
  finishedBilliardSessions,
  formatCurrency,
  formatDateTime,
  formatPlayDuration,
  formatTimeOnly,
  mergeOrderItems,
  orderContentSummary
} from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Card, CardContent } from '../../shared/components/Card'
import {
  ChevronLeft,
  Clock,
  User,
  MapPin,
  CreditCard,
  Printer,
  UserCheck,
  Calendar,
  Layers
} from 'lucide-react'
import { InvoicePrint } from '../order/InvoicePrint'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

function itemStatusConfig(status) {
  switch (status) {
    case 'PENDING':
      return { label: 'Chờ làm', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' }
    case 'IN_PROGRESS':
      return { label: 'Đang làm', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' }
    case 'DONE':
      return { label: 'Đã xong', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' }
    case 'SERVED':
      return { label: 'Đã phục vụ', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800' }
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300' }
  }
}

function paymentMethodLabel(method) {
  switch (method) {
    case 'CASH':
      return 'Tiền mặt'
    case 'BANK_TRANSFER':
    case 'QR':
      return 'Chuyển khoản / QR'
    case 'CARD':
      return 'Thẻ ATM'
    case 'EWALLET':
      return 'Ví điện tử'
    default:
      return method || 'Tiền mặt'
  }
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => historyApi.getOrderDetail(id),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-brand-500 font-medium">Đang tải chi tiết đơn hàng...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-brand-500 font-medium">Không tìm thấy đơn hàng</p>
        <Button onClick={() => navigate('/history')} className="rounded-xl">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const isCompleted = order.status === 'COMPLETED' || order.status === 'PAID'
  const billiardSessions = finishedBilliardSessions(order)
  const billiardAmount = billiardSessions.reduce((sum, session) => sum + Number(session.totalAmount || 0), 0)
  const drinksAmount = drinkAmountOf(order)
  const drinksCount = drinkCountOf(order)

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto print-hidden pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/history')}
              className="gap-1.5 shrink-0 rounded-xl"
            >
              <ChevronLeft size={18} />
              Quay lại
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-900 dark:text-brand-50 truncate">
                  Chi tiết đơn hàng #{order.id}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isCompleted 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                }`}>
                  {isCompleted ? 'Hoàn thành' : 'Đã hủy'}
                </span>
              </div>
              <p className="text-brand-500 dark:text-brand-400 text-xs sm:text-sm mt-0.5 truncate">
                {orderContentSummary(order)}
              </p>
            </div>
          </div>

          <Button onClick={() => window.print()} className="gap-2 rounded-xl shrink-0">
            <Printer size={17} />
            <span>Xuất hóa đơn</span>
          </Button>
        </div>

        {order.previousOrder && (
          <Card className="rounded-2xl border-brand-200 dark:border-brand-700">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-brand-700 dark:text-brand-300 text-sm">
                <Layers size={18} className="shrink-0 text-brand-500" />
                <span>
                  Đơn này được tạo nối tiếp sau khi thanh toán đơn trước đó (<strong className="font-semibold">#{order.previousOrder.id}</strong>).
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/history/${order.previousOrder.id}`)}
                className="rounded-xl shrink-0"
              >
                Xem đơn trước đó
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-brand-200 dark:border-brand-700">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-brand-900 dark:text-brand-100 border-b border-brand-100 dark:border-brand-700 pb-3">
              Thông tin đơn hàng
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Bàn</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm">{order.table?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Chủ bàn / Khách</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm">{order.customerName || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserCheck className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Nhân viên</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm">{order.staff?.fullName || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Thanh toán</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm">
                    {paymentMethodLabel(order.paymentMethod || (order.payments && order.payments[0]?.method))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Thời gian tạo</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm font-mono">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-brand-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Thời gian đóng</p>
                  <p className="font-bold text-brand-900 dark:text-brand-100 text-sm font-mono">
                    {order.closedAt ? format(new Date(order.closedAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {billiardSessions.length > 0 && (
          <Card className="rounded-2xl border-brand-200 dark:border-brand-700">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-brand-900 dark:text-brand-100 border-b border-brand-100 dark:border-brand-700 pb-3 flex items-center justify-between">
                <span>Giờ chơi Bi-a</span>
                <span className="text-xs font-semibold text-brand-500">({billiardSessions.length} phiên)</span>
              </h2>

              <div className="space-y-3">
                {billiardSessions.map((session) => {
                  const seconds = durationSecondsBetween(session.startTime, session.endTime)
                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border border-brand-200 dark:border-brand-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-brand-900 dark:text-brand-100 text-sm">
                          Phiên {session.sessionNo || session.id}
                        </span>
                        <span className="font-bold text-brand-900 dark:text-brand-100 text-sm">
                          {formatCurrency(session.totalAmount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-brand-600 dark:text-brand-400 font-mono">
                        <p>Bắt đầu: {formatDateTime(session.startTime)}</p>
                        <p>Kết thúc: {formatDateTime(session.endTime)}</p>
                        <p className="sm:col-span-2 font-sans text-brand-800 dark:text-brand-200">
                          Thời gian: <strong className="font-bold">{formatPlayDuration(seconds)}</strong> ({formatTimeOnly(session.startTime)} → {formatTimeOnly(session.endTime)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-brand-200 dark:border-brand-700">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-brand-900 dark:text-brand-100 border-b border-brand-100 dark:border-brand-700 pb-3 flex items-center justify-between">
              <span>Danh sách món</span>
              {drinksCount > 0 && (
                <span className="text-xs font-semibold text-brand-500">({drinksCount} món)</span>
              )}
            </h2>

            <div className="space-y-2.5">
              {order.items?.length ? (
                mergeOrderItems(order.items).map((item) => {
                  const isCancelled = item.status === 'CANCELLED'
                  const status = itemStatusConfig(item.status)
                  return (
                    <div
                      key={item.key}
                      className={`flex items-start justify-between p-3.5 rounded-xl border border-brand-200 dark:border-brand-700 ${
                        isCancelled ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold text-sm ${
                            isCancelled ? 'line-through text-brand-400' : 'text-brand-900 dark:text-brand-50'
                          }`}>
                            {item.quantity}x {item.product?.name}
                          </p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-brand-500 dark:text-brand-400 italic mt-0.5">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${
                          isCancelled ? 'line-through text-brand-400' : 'text-brand-900 dark:text-brand-50'
                        }`}>
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                        <p className="text-xs text-brand-500 dark:text-brand-400">
                          {formatCurrency(item.unitPrice)} / món
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-brand-400 py-4 text-center">Không có món nước</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-brand-200 dark:border-brand-700">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-brand-900 dark:text-brand-100 border-b border-brand-100 dark:border-brand-700 pb-3">
              Thanh toán
            </h2>

            <div className="space-y-2.5 text-sm">
              {billiardAmount > 0 && (
                <div className="flex justify-between text-brand-700 dark:text-brand-300">
                  <span>Tiền giờ Bi-a</span>
                  <span className="font-semibold text-brand-900 dark:text-brand-100">{formatCurrency(billiardAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-700 dark:text-brand-300">
                <span>Tiền món {drinksCount > 0 ? `(${drinksCount} món)` : ''}</span>
                <span className="font-semibold text-brand-900 dark:text-brand-100">{formatCurrency(drinksAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-brand-700 dark:text-brand-300 font-medium">
                  <span>Giảm giá</span>
                  <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-brand-200 dark:border-brand-700">
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-bold text-brand-900 dark:text-brand-100">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-brand-900 dark:text-brand-50">
                    {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-2 rounded-xl shrink-0 self-start sm:self-auto"
                >
                  <Printer size={16} />
                  <span>Xuất hóa đơn</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoicePrint
        table={order.table}
        customerName={order.customerName}
        orderItems={order.items || []}
        billiardSessions={billiardSessions}
        totalAmount={order.finalAmount || order.totalAmount || 0}
        discountAmount={order.discountAmount || 0}
        orderDate={order.closedAt || order.createdAt}
        orderId={order.id}
      />
    </>
  )
}