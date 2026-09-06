import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCartStore } from '../../app/store'
import { billiardApi, categoryApi, orderApi, productApi, tableApi, toppingApi } from '../../shared/lib/api'
import { DrinkOptionModal } from './DrinkOptionModal'
import { buildDrinkNote } from '../../shared/lib/drinkOptions'
import { formatCurrency } from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import QRCode from 'react-qr-code'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'QR', label: 'QR' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
]

function itemStatusLabel(status) {
  switch (status) {
    case 'PENDING': return 'Chờ làm'
    case 'IN_PROGRESS': return 'Đang làm'
    case 'DONE': return 'Đã xong'
    case 'SERVED': return 'Đã phục vụ'
    default: return status
  }
}

export function OrderPage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const numericTableId = Number(tableId)

  const [activeCategory, setActiveCategory] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [payTiming, setPayTiming] = useState('AFTER')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const cart = useCartStore(state => state.items)
  const addItem = useCartStore(state => state.addItem)
  const changeQty = useCartStore(state => state.changeQty)
  const removeItem = useCartStore(state => state.removeItem)
  const clearCart = useCartStore(state => state.clearCart)

  const { data: table, isLoading: tableLoading } = useQuery({
    queryKey: ['table', numericTableId],
    queryFn: () => tableApi.get(numericTableId),
    enabled: Number.isFinite(numericTableId),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => productApi.list(activeCategory),
    enabled: Boolean(activeCategory),
  })

  const { data: toppings = [] } = useQuery({
    queryKey: ['toppings'],
    queryFn: () => toppingApi.list(false),
  })

  const { data: order } = useQuery({
    queryKey: ['order-by-table', numericTableId],
    queryFn: () => orderApi.getByTable(numericTableId),
    enabled: Number.isFinite(numericTableId),
  })

  const { data: billiard, refetch: refetchBilliard } = useQuery({
    queryKey: ['billiard-current', numericTableId],
    queryFn: () => billiardApi.current(numericTableId),
    enabled: table?.type === 'BILLIARD',
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  useEffect(() => {
    clearCart()
  }, [numericTableId, clearCart])

  const sendOrder = useMutation({
    mutationFn: async (payNow) => {
      const items = cart.map(item => {
        // Build extra note with customer name
        const extraNote = [
          customerName && `Khách: ${customerName}`,
          item.options?.extraNote
        ].filter(Boolean).join(' | ')
        
        return {
          productId: item.product.id,
          quantity: item.quantity,
          note: extraNote || undefined, // Backend will build full note with ice/sugar/topping
          icePercent: item.options?.ice ?? 100,
          sugarPercent: item.options?.sugar ?? 100,
          toppingIds: item.options?.toppingIds || [],
        }
      })
      await orderApi.submit({
        tableId: numericTableId,
        items,
        payNow,
        method: payNow ? paymentMethod : undefined,
      })
      return { payNow }
    },
    onSuccess: async ({ payNow }) => {
      clearCart()
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['order-by-table', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['billiard-current', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      if (payNow) {
        navigate('/')
      }
    },
    onError: (err) => setError(err.message),
  })

  const checkout = useMutation({
    mutationFn: () => {
      if (!order?.id) {
        throw new Error('Không tìm thấy đơn hàng để thanh toán')
      }
      return orderApi.checkout(order.id, { 
        discountAmount: 0,
        payments: [{
          method: paymentMethod,
          amount: orderTotal
        }] 
      })
    },
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      navigate('/')
    },
    onError: (err) => setError(err.message),
  })

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (table?.type !== 'BILLIARD') return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [table?.type])

  const refreshTableOrder = async () => {
    await refetchBilliard()
    await queryClient.invalidateQueries({ queryKey: ['order-by-table', numericTableId] })
    await queryClient.invalidateQueries({ queryKey: ['tables'] })
  }

  const startBilliard = useMutation({
    mutationFn: () => billiardApi.start(numericTableId),
    onSuccess: async () => {
      setError('')
      await refreshTableOrder()
    },
    onError: (err) => setError(err.message),
  })

  const stopBilliard = useMutation({
    mutationFn: () => billiardApi.stop(numericTableId),
    onSuccess: async () => {
      setError('')
      await refreshTableOrder()
    },
    onError: (err) => setError(err.message),
  })

  const isBilliard = table?.type === 'BILLIARD'
  const finishedSessions = useMemo(
    () => (order?.billiardSessions || []).filter(s => s.status === 'FINISHED'),
    [order]
  )
  const playingElapsed = billiard?.startTime
    ? Math.max(0, Math.floor((now - new Date(billiard.startTime).getTime()) / 1000))
    : Number(billiard?.elapsedSeconds || 0)
  const itemsTotalAmount = cart.reduce((sum, item) => sum + (Number(item.unitPrice ?? item.product.basePrice) * item.quantity), 0)
  const orderTotal = Number(order?.finalAmount || order?.totalAmount || 0)
  const billiardAmount = Number(billiard?.currentAmount || 0)
  const totalAmount = itemsTotalAmount + orderTotal + (billiard ? billiardAmount : 0)

  if (tableLoading) {
    return <p className="text-brand-500">Đang tải bàn...</p>
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6 overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-brand-100 rounded-lg text-brand-600 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Order - {table?.name || 'Bàn'}</h1>
            <p className="text-brand-500 text-sm">Chọn món vào giỏ hàng</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-brand-700 hover:bg-brand-100 border border-brand-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pb-10 hide-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-brand-400 hover:shadow-md transition-all group overflow-hidden"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="h-32 bg-brand-100 overflow-hidden relative flex items-center justify-center text-brand-400">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <ShoppingBag size={36} />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-brand-900 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-brand-600 font-bold">{formatCurrency(product.basePrice)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="w-80 lg:w-96 bg-white dark:bg-brand-800 rounded-xl border border-brand-200 dark:border-brand-700 flex flex-col h-full shadow-sm shrink-0 overflow-hidden">
        <div className="p-4 border-b border-brand-100 dark:border-brand-700 bg-brand-50/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-brand-600" />
            <h2 className="font-bold text-lg">Giỏ hàng</h2>
            <Badge className="ml-auto bg-brand-600 text-white">{cart.length}</Badge>
          </div>
          <input
            type="text"
            placeholder="Tên chủ bàn / Khách hàng (Tùy chọn)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-brand-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isBilliard && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Giờ chơi Bi-a</h3>
              {finishedSessions.length > 0 && (
                <div className="space-y-2 mb-3">
                  {finishedSessions.map(session => (
                    <div key={session.id} className="text-sm text-blue-800 flex justify-between">
                      <span>Phiên {session.sessionNo || session.id} (đã chốt)</span>
                      <span className="font-semibold">{formatCurrency(session.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {!billiard && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => startBilliard.mutate()} disabled={startBilliard.isPending}>
                  Bắt đầu tính giờ
                </Button>
              )}
              {billiard && (
                <div className="space-y-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Đang chơi: {Math.floor(playingElapsed / 60)} phút {playingElapsed % 60} giây
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Tạm tính: <span className="font-semibold">{formatCurrency(billiard.currentAmount)}</span>
                  </p>
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={() => stopBilliard.mutate()} disabled={stopBilliard.isPending}>
                    Kết thúc (Chốt tiền)
                  </Button>
                </div>
              )}
            </div>
          )}

          {order?.items?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-brand-500 uppercase">Đã gửi bếp</p>
              {order.items.map(item => (
                <div key={item.id} className="p-3 bg-white rounded-lg border border-brand-100">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-sm">{item.quantity}x {item.product?.name}</span>
                    <span className="text-xs text-brand-500">{itemStatusLabel(item.status)}</span>
                  </div>
                  {item.note && <p className="text-xs text-red-500 italic mt-1">{item.note}</p>}
                </div>
              ))}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-brand-400 gap-4 py-8">
              <ShoppingBag size={48} className="opacity-50" />
              <p>Chưa có món mới</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-brand-50 dark:bg-brand-900/50 rounded-lg border border-brand-100 dark:border-brand-700">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-sm line-clamp-2 pr-2">{item.product.name}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-brand-500">
                  {buildDrinkNote({
                    hasDrinkOptions: item.product.hasDrinkOptions !== false,
                    ice: item.options?.ice ?? 100,
                    sugar: item.options?.sugar ?? 100,
                    toppings: item.toppings || [],
                    extraNote: item.options?.extraNote,
                  })}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-brand-600 text-sm">
                    {formatCurrency((item.unitPrice ?? item.product.basePrice) * item.quantity)}
                  </span>

                  <div className="flex items-center gap-2 bg-white dark:bg-brand-800 rounded-md border border-brand-200 p-0.5">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="p-1 text-brand-600 hover:bg-brand-100 rounded"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      className="p-1 text-brand-600 hover:bg-brand-100 rounded"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-brand-50/50 border-t border-brand-100 dark:border-brand-700 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-brand-600">Tổng cộng:</span>
            <span className="font-bold text-brand-900 dark:text-brand-50 text-xl">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-500 uppercase">Thanh toán</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayTiming('AFTER')}
                className={`h-10 rounded-lg text-sm font-medium border ${payTiming === 'AFTER' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-brand-200 text-brand-700'}`}
              >
                Trả sau
              </button>
              <button
                type="button"
                onClick={() => setPayTiming('BEFORE')}
                className={`h-10 rounded-lg text-sm font-medium border ${payTiming === 'BEFORE' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-brand-200 text-brand-700'}`}
              >
                Trả trước
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`h-10 rounded-lg text-xs font-medium border ${paymentMethod === m.value ? 'bg-brand-100 text-brand-800 border-brand-400' : 'bg-white border-brand-200 text-brand-600'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'QR' && (
              <div className="flex flex-col items-center gap-2 py-2 bg-white rounded-lg border border-brand-100">
                <QRCode
                  size={128}
                  value={`BOMCOFFEE|BAN:${table?.name || numericTableId}|TIEN:${Math.round(totalAmount)}|${paymentMethod}`}
                />
                <p className="text-xs text-brand-500">Quét QR để chuyển khoản {formatCurrency(totalAmount)}</p>
              </div>
            )}
            {paymentMethod === 'BANK_TRANSFER' && (
              <p className="text-xs text-brand-600 bg-white border border-brand-100 rounded-lg p-2">
                Chuyển khoản theo tổng tiền {formatCurrency(totalAmount)}, nội dung: {table?.name || `Bàn ${numericTableId}`}
              </p>
            )}
          </div>
          <Button
            className="w-full h-12 text-base shadow-md"
            disabled={cart.length === 0 || sendOrder.isPending}
            onClick={() => sendOrder.mutate(payTiming === 'BEFORE')}
          >
            {sendOrder.isPending
              ? 'Đang xử lý...'
              : payTiming === 'BEFORE'
                ? `Gửi & thanh toán (${cart.length} món)`
                : `Gửi order — trả sau (${cart.length} món)`}
          </Button>
          {order && payTiming === 'AFTER' && (
            <Button
              variant="outline"
              className="w-full h-11"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate()}
            >
              {checkout.isPending ? 'Đang thanh toán...' : 'Thanh toán đơn hiện tại & trả bàn'}
            </Button>
          )}
        </div>
      </div>

      {selectedProduct && (
        <DrinkOptionModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
          onAdd={(options) => {
            addItem(selectedProduct, 1, options, toppings)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
