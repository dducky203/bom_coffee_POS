import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { historyApi } from '../../shared/lib/api'
import { drinkAmountOf, drinkCountOf, durationSecondsBetween, finishedBilliardSessions, formatCurrency, formatDateTime, formatPlayDuration, formatTimeOnly, mergeOrderItems, orderContentSummary } from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { ChevronLeft, Clock, User, MapPin, CreditCard, Printer } from 'lucide-react'
import { InvoicePrint } from '../order/InvoicePrint'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

function itemStatusLabel(status) {
  switch (status) {
    case 'PENDING': return { label: 'Chờ làm', color: 'bg-yellow-100 text-yellow-800' }
    case 'IN_PROGRESS': return { label: 'Đang làm', color: 'bg-blue-100 text-blue-800' }
    case 'DONE': return { label: 'Đã xong', color: 'bg-green-100 text-green-800' }
    case 'SERVED': return { label: 'Đã phục vụ', color: 'bg-green-100 text-green-800' }
    case 'CANCELLED': return { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    default: return { label: status, color: 'bg-gray-100 text-gray-800' }
  }
}

function paymentMethodLabel(method) {
  switch (method) {
    case 'CASH': return 'Tiền mặt'
    case 'BANK_TRANSFER':
    case 'QR': return 'Chuyển khoản'
    case 'CARD': return 'Thẻ'
    case 'EWALLET': return 'Ví điện tử'
    default: return method || 'Tiền mặt'
  }
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => historyApi.getOrderDetail(id),
  })

  const order = data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-brand-500">Đang tải...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-brand-500">Không tìm thấy đơn hàng</p>
        <Button onClick={() => navigate('/history')}>Quay lại danh sách</Button>
      </div>
    )
  }

  const orderStatus = order.status === 'COMPLETED' || order.status === 'PAID' ? 'Hoàn thành' : 'Đã hủy'
  const orderStatusColor = order.status === 'COMPLETED' || order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  const billiardSessions = finishedBilliardSessions(order)
  const billiardAmount = billiardSessions.reduce((sum, session) => sum + Number(session.totalAmount || 0), 0)
  const drinksAmount = drinkAmountOf(order)
  const drinksCount = drinkCountOf(order)

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto print-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/history')}
              className="gap-2 shrink-0"
            >
              <ChevronLeft size={18} />
              Quay lại
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-brand-900 truncate">Chi tiết đơn hàng #{order.id}</h1>
              <p className="text-brand-500 text-sm truncate">{orderContentSummary(order)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Badge className={`${orderStatusColor} text-base px-3.5 py-1.5`}>{orderStatus}</Badge>
            <Button
              onClick={() => window.print()}
              className="gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold shadow-md shadow-brand-700/20 active:scale-95 transition-all text-sm h-10 px-4"
              title="In hóa đơn đơn hàng này"
            >
              <Printer size={17} />
              <span>Xuất hóa đơn</span>
            </Button>
          </div>
        </div>

      {/* Order Info */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-900 mb-4">Thông tin đơn hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Bàn</p>
                <p className="font-semibold text-brand-900">{order.table?.name || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Chủ bàn / Khách</p>
                <p className="font-semibold text-brand-900">{order.customerName || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Nhân viên</p>
                <p className="font-semibold text-brand-900">{order.staff?.fullName || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Phương thức thanh toán</p>
                <p className="font-semibold text-brand-900">
                  {paymentMethodLabel(order.paymentMethod || (order.payments && order.payments[0]?.method))}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Thời gian tạo</p>
                <p className="font-semibold text-brand-900">
                  {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-brand-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-brand-500">Thời gian đóng</p>
                <p className="font-semibold text-brand-900">
                  {order.closedAt ? format(new Date(order.closedAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi }) : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {billiardSessions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-brand-900 mb-4">Giờ chơi Bi-a</h2>
            <div className="space-y-3">
              {billiardSessions.map((session) => {
                const seconds = durationSecondsBetween(session.startTime, session.endTime)
                return (
                  <div key={session.id} className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="font-semibold text-blue-900">
                        Phiên {session.sessionNo || session.id}
                      </p>
                      <p className="font-bold text-blue-900">{formatCurrency(session.totalAmount)}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
                      <p>Giờ bắt đầu: <span className="font-mono font-semibold">{formatDateTime(session.startTime)}</span></p>
                      <p>Giờ kết thúc: <span className="font-mono font-semibold">{formatDateTime(session.endTime)}</span></p>
                      <p>Thời gian chơi: <span className="font-semibold">{formatPlayDuration(seconds)} ({formatTimeOnly(session.startTime)} → {formatTimeOnly(session.endTime)})</span></p>
                      <p>Tiền giờ: <span className="font-semibold">{formatCurrency(session.totalAmount)}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-900 mb-4">Danh sách món {drinksCount > 0 ? `(${drinksCount} nước)` : ''}</h2>
          <div className="space-y-3">
            {order.items?.length ? mergeOrderItems(order.items).map((item) => {
              const itemStatus = itemStatusLabel(item.status)
              const isCancelled = item.status === 'CANCELLED'
              return (
                <div
                  key={item.key}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    isCancelled ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold ${isCancelled ? 'line-through text-gray-500' : 'text-brand-900'}`}>
                        {item.quantity}x {item.product?.name}
                      </p>
                      <Badge className={itemStatus.color}>{itemStatus.label}</Badge>
                    </div>
                    {item.note && (
                      <p className="text-sm text-brand-600 italic">{item.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isCancelled ? 'line-through text-gray-500' : 'text-brand-900'}`}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    <p className="text-xs text-brand-500">{formatCurrency(item.unitPrice)} / món</p>
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-brand-400">Không có món nước</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-900 mb-4">Thanh toán</h2>
          <div className="space-y-3">
            {billiardAmount > 0 && (
              <div className="flex justify-between text-brand-700">
                <span>Tiền giờ bi-a</span>
                <span className="font-semibold">{formatCurrency(billiardAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-700">
              <span>Tiền nước {drinksCount > 0 ? `(${drinksCount} món)` : ''}</span>
              <span className="font-semibold">{formatCurrency(drinksAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giảm giá</span>
                <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-brand-200">
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold text-brand-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-brand-900">{formatCurrency(order.finalAmount)}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-2 border-brand-300 dark:border-brand-600 font-bold hover:bg-brand-50 shadow-sm self-start sm:self-auto"
              >
                <Printer size={16} />
                <span>Xuất hóa đơn</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link to previous/next orders */}
      {order.previousOrder && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800 mb-2">
              Đơn này được tạo sau khi khách đã thanh toán đơn trước
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/history/${order.previousOrder.id}`)}
            >
              Xem đơn trước đó (#{order.previousOrder.id})
            </Button>
          </CardContent>
        </Card>
      )}
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
