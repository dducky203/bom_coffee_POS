import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, CheckCircle2, ChevronLeft, Coffee, Flame, Minus, PanelRightClose, PanelRightOpen, Plus, Printer, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { useNavigate, useParams } from 'react-router-dom'
import { useCartStore } from '../../app/store'
import { Badge } from '../../shared/components/Badge'
import { Button } from '../../shared/components/Button'
import { LoadingPage } from '../../shared/components/Loading'
import { billiardApi, kdsApi, orderApi } from '../../shared/lib/api'
import { buildDrinkNote } from '../../shared/lib/drinkOptions'
import { categoriesQuery, productsQuery, tablesQuery, toppingsQuery } from '../../shared/lib/queries'
import { durationSecondsBetween, formatCurrency, formatPlayDuration, formatTimeOnly, parseServerDate } from '../../shared/lib/utils'
import { DrinkOptionModal } from './DrinkOptionModal'
import { InvoicePrint } from './InvoicePrint'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
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
  const [searchQuery, setSearchQuery] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [payTiming, setPayTiming] = useState('AFTER')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isDesktopCartVisible, setIsDesktopCartVisible] = useState(true)

  const cart = useCartStore(state => state.items)
  const addItem = useCartStore(state => state.addItem)
  const changeQty = useCartStore(state => state.changeQty)
  const removeItem = useCartStore(state => state.removeItem)
  const clearCart = useCartStore(state => state.clearCart)

  const { data: tables = [], isLoading: tableLoading } = useQuery(tablesQuery)
  const table = tables.find(t => t.id === numericTableId)

  const { data: categories = [] } = useQuery(categoriesQuery)
  const { data: allProducts = [] } = useQuery(productsQuery)
  const { data: toppings = [] } = useQuery(toppingsQuery)

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesCat = !activeCategory || activeCategory === 'ALL' || (p.category?.id ?? p.categoryId) === activeCategory
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [allProducts, activeCategory, searchQuery])

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

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (table?.type !== 'BILLIARD') return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [table?.type])

  useEffect(() => {
    clearCart()
    setCustomerName('')
  }, [numericTableId, clearCart])

  useEffect(() => {
    if (order?.customerName) {
      setCustomerName(order.customerName)
    }
  }, [order?.id, order?.customerName])

  const sendOrder = useMutation({
    mutationFn: async (payNow) => {
      const items = cart.map(item => {
        return {
          productId: item.product.id,
          quantity: item.quantity,
          note: item.options?.extraNote || undefined,
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
        customerName: customerName.trim() || undefined,
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
        customerName: customerName.trim() || undefined,
        payments: [{
          method: paymentMethod,
          amount: orderTotal + (liveBilliard ? billiardAmount : 0)
        }]
      })
    },
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      await queryClient.invalidateQueries({ queryKey: ['billiard-current', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['billiard-sessions'] })
      navigate('/')
    },
    onError: (err) => setError(err.message),
  })

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
    mutationFn: (sessionId) => billiardApi.stop(numericTableId, sessionId),
    onSuccess: async () => {
      setError('')
      await refreshTableOrder()
    },
    onError: async (err) => {
      setError(err.message)
      await refreshTableOrder()
    },
  })

  const updateItemStatus = useMutation({
    mutationFn: ({ item, status = 'DONE' }) => kdsApi.updateStatus(item.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order-by-table', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['kds-queue'] })
    },
    onError: (err) => setError(err.message),
  })

  const updateAllItemsStatus = useMutation({
    mutationFn: ({ items, status = 'DONE' }) =>
      kdsApi.updateStatuses(items.map(item => item.id), status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order-by-table', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['kds-queue'] })
    },
    onError: (err) => setError(err.message),
  })

  const isBilliard = table?.type === 'BILLIARD'
  const finishedSessions = useMemo(
    () => (order?.billiardSessions || []).filter(s => {
      if (s.status !== 'FINISHED') return false
      if (!order?.createdAt || !s.startTime) return true
      return new Date(s.startTime).getTime() >= new Date(order.createdAt).getTime() - 2 * 60 * 1000
    }),
    [order]
  )
  const playingFromOrder = useMemo(
    () => (order?.billiardSessions || []).find(s => s.status === 'PLAYING'),
    [order]
  )
  const liveBilliard = billiard?.sessionId || billiard?.startTime
    ? billiard
    : playingFromOrder
      ? {
        sessionId: playingFromOrder.id,
        startTime: playingFromOrder.startTime,
        currentAmount: playingFromOrder.totalAmount || 0,
        status: 'PLAYING',
      }
      : null
  const startTimeDate = parseServerDate(liveBilliard?.startTime)
  const playingElapsed = startTimeDate
    ? Math.max(0, Math.floor((now - startTimeDate.getTime()) / 1000))
    : Number(liveBilliard?.elapsedSeconds || 0)
  const itemsTotalAmount = cart.reduce((sum, item) => sum + (Number(item.unitPrice ?? item.product.basePrice) * item.quantity), 0)
  const orderTotal = Number(order?.finalAmount || order?.totalAmount || 0)
  const billiardAmount = Number(liveBilliard?.currentAmount || 0)
  const totalAmount = itemsTotalAmount + orderTotal + (liveBilliard ? billiardAmount : 0)

  if (tableLoading) {
    return <LoadingPage text="Đang tải dữ liệu bàn..." />
  }

  return (
    <>
      <div className="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] flex overflow-hidden relative print-hidden">
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between gap-4 mb-4 shrink-0 pt-2 lg:pt-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-xl text-brand-600 dark:text-brand-300 transition-colors"
                title="Quay lại danh sách bàn"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight">Order - {table?.name || 'Bàn'}</h1>
                <p className="text-brand-500 dark:text-brand-400 text-xs">
                  {customerName.trim() ? `Chủ bàn: ${customerName.trim()}` : 'Chọn món thêm vào giỏ order'}
                </p>
              </div>
            </div>

            {/* Desktop Cart Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDesktopCartVisible(!isDesktopCartVisible)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-800 border border-brand-200/80 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700/80 shadow-sm transition-all text-xs font-bold"
            >
              {isDesktopCartVisible ? (
                <>
                  <PanelRightClose size={18} className="text-brand-600 dark:text-brand-400" />
                  <span>Ẩn giỏ hàng</span>
                </>
              ) : (
                <>
                  <PanelRightOpen size={18} className="text-brand-600 dark:text-brand-400" />
                  <span>Hiện giỏ hàng ({cart.length})</span>
                  {cart.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  )}
                </>
              )}
            </button>
          </div>

          {/* Search & Category Filter Header Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
            <div className="min-w-0 flex-1 flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${!activeCategory || activeCategory === 'ALL'
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 scale-[1.02]'
                    : 'bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-700 border border-brand-200/80 dark:border-brand-700'
                  }`}
              >
                Tất cả ({allProducts.length})
              </button>
              {categories.map(cat => {
                const isActive = activeCategory === cat.id
                const count = allProducts.filter(p => (p.category?.id ?? p.categoryId) === cat.id).length
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${isActive
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 scale-[1.02]'
                        : 'bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-700 border border-brand-200/80 dark:border-brand-700'
                      }`}
                  >
                    {cat.name} ({count})
                  </button>
                )
              })}
            </div>

            {/* Search Box Input */}
            <div className="relative shrink-0 w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="text"
                placeholder="Tìm tên món..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-brand-200/80 dark:border-brand-700 bg-white dark:bg-brand-800 text-xs font-medium text-brand-900 dark:text-brand-50 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-brand-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 dark:hover:text-brand-200 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-brand-400 space-y-2">
                <Coffee size={40} strokeWidth={1.5} />
                <p className="text-sm font-medium">Không tìm thấy món nước nào phù hợp</p>
              </div>
            ) : (
              <div className={`grid gap-3.5 sm:gap-4 ${isDesktopCartVisible
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                }`}>
                {filteredProducts.map(product => {
                  const hasCustomOptions = product.hasDrinkOptions !== false
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="group cursor-pointer rounded-2xl border border-brand-200/70 dark:border-brand-700/80 bg-white dark:bg-brand-800 shadow-sm hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Image Container */}
                      <div className="h-36 sm:h-40 bg-gradient-to-br from-brand-100/60 to-brand-50 dark:from-brand-850 dark:to-brand-800 relative overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-brand-400 dark:text-brand-600 group-hover:scale-110 transition-transform duration-300">
                            <Coffee size={36} strokeWidth={1.5} />
                          </div>
                        )}

                        {/* HOT Tag */}
                        {hasCustomOptions && (
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider shadow-md shadow-orange-500/40 animate-pulse border border-amber-300/40 z-10">
                            <Flame size={12} className="fill-amber-200 text-amber-100 animate-bounce" />
                            HOT
                          </span>
                        )}

                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Plus size={22} strokeWidth={3} />
                          </div>
                        </div>
                      </div>

                      {/* Card Content Area */}
                      <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                        <div>
                          <h3 className="font-bold text-sm text-brand-900 dark:text-brand-50 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-[11px] text-brand-500 dark:text-brand-400 line-clamp-1 mt-0.5">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-brand-100 dark:border-brand-700/80">
                          <span className="text-sm font-black text-brand-900 dark:text-brand-50">
                            {formatCurrency(product.basePrice)}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-700 text-brand-600 dark:text-brand-200 group-hover:bg-brand-600 group-hover:text-white dark:group-hover:bg-brand-600 flex items-center justify-center transition-all duration-200 shadow-sm">
                            <Plus size={16} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mobile View Cart Button */}
          <div className="lg:hidden p-4 bg-brand-50 dark:bg-brand-900 border-t border-brand-200 dark:border-brand-800 shrink-0 pb-6">
            <Button
              className="w-full h-14 flex justify-between items-center px-4 rounded-xl shadow-lg"
              onClick={() => setIsCartOpen(true)}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={24} />
                <span className="font-semibold text-lg">{cart.length} món</span>
              </div>
              <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
            </Button>
          </div>
        </div>

        {/* Cart Drawer Overlay on Mobile */}
        {isCartOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        {/* Cart Container */}
        <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white dark:bg-brand-800 flex flex-col shadow-2xl transition-all duration-300 transform 
        lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto lg:rounded-xl lg:border lg:border-brand-200 lg:dark:border-brand-700
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isDesktopCartVisible ? 'lg:w-96 lg:ml-6 lg:flex' : 'lg:w-0 lg:ml-0 lg:hidden'}
      `}>
          <div className="p-4 border-b border-brand-100 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/30 flex flex-col gap-3 relative pt-safe">
            <button
              type="button"
              className="lg:hidden absolute top-4 right-4 p-2 bg-white dark:bg-brand-700 rounded-full shadow-sm text-brand-500 hover:text-brand-900 dark:text-brand-300 dark:hover:text-white"
              onClick={() => setIsCartOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between pr-10 lg:pr-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-brand-600 dark:text-brand-400" />
                <h2 className="font-bold text-lg text-brand-900 dark:text-brand-50">Giỏ hàng</h2>
                <Badge className="bg-brand-600 text-white font-bold">{cart.length}</Badge>
              </div>

              {/* Desktop Cart Close/Collapse Button */}
              <button
                type="button"
                onClick={() => setIsDesktopCartVisible(false)}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg text-brand-500 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-100 hover:bg-brand-100 dark:hover:bg-brand-700 transition-colors text-xs font-semibold"
                title="Ẩn giỏ hàng"
              >
                <PanelRightClose size={18} />
                <span>Ẩn</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Tên chủ bàn / Khách hàng (Tùy chọn)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-brand-200/80 dark:border-brand-700 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 placeholder:text-brand-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isBilliard && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Giờ chơi Bi-a</h3>
                {finishedSessions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {finishedSessions.map(session => {
                      const seconds = durationSecondsBetween(session.startTime, session.endTime)
                      return (
                        <div key={session.id} className="text-sm text-blue-800 dark:text-blue-200 space-y-0.5">
                          <div className="flex justify-between font-medium">
                            <span>Phiên {session.sessionNo || session.id}</span>
                            <span className="font-semibold">{formatCurrency(session.totalAmount)}</span>
                          </div>
                          <p className="text-xs">
                            {formatTimeOnly(session.startTime)} → {formatTimeOnly(session.endTime)} · {formatPlayDuration(seconds)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
                {!liveBilliard && (
                  <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => startBilliard.mutate()} disabled={startBilliard.isPending}>
                    Bắt đầu tính giờ
                  </Button>
                )}
                {liveBilliard && (
                  <div className="space-y-3 p-3 rounded-2xl bg-brand-50/80 dark:bg-brand-900/50 border border-brand-200/80 dark:border-brand-700">
                    <div className="text-xs text-brand-700 dark:text-brand-300 space-y-1.5">
                      <div className="flex justify-between items-center pb-1 border-b border-brand-200/60 dark:border-brand-700/60">
                        <span className="font-bold text-brand-900 dark:text-brand-100">
                          🎱 Giờ chơi Bi-a
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Đang tính giờ
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-500">Giờ bắt đầu</span>
                        <span className="font-mono font-semibold text-brand-900 dark:text-brand-100">{formatTimeOnly(liveBilliard.startTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-500">Giờ kết thúc</span>
                        <span className="font-mono font-semibold text-brand-900 dark:text-brand-100">{formatTimeOnly(now)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-500">Thời gian chơi</span>
                        <span className="font-semibold text-brand-900 dark:text-brand-100">{formatPlayDuration(playingElapsed)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-brand-200/60 dark:border-brand-700/60 font-medium">
                        <span className="text-brand-600 dark:text-brand-400">Tạm tính tiền giờ</span>
                        <span className="font-bold text-brand-900 dark:text-brand-50">{formatCurrency(liveBilliard.currentAmount)}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
                      onClick={() => stopBilliard.mutate(liveBilliard.sessionId)}
                      disabled={stopBilliard.isPending}
                    >
                      Kết thúc (Chốt tiền)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {order?.items?.length > 0 && (
              <div className="space-y-2.5 bg-brand-50/60 dark:bg-brand-900/40 p-3 rounded-xl border border-brand-200/70 dark:border-brand-800">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-brand-200/50 dark:border-brand-800/60">
                  <div>
                    <p className="text-xs font-bold text-brand-800 dark:text-brand-200 uppercase tracking-wide">
                      Món đã gửi bếp ({order.items.length})
                    </p>
                    <p className="text-[11px] text-brand-500 dark:text-brand-400">
                      Bấm "Ra món" khi bưng đồ ra bàn
                    </p>
                  </div>
                  {order.items.some(i => i.status !== 'DONE') && (
                    <button
                      type="button"
                      disabled={updateAllItemsStatus.isPending}
                      onClick={() => {
                        const unfinished = order.items.filter(i => i.status !== 'DONE')
                        updateAllItemsStatus.mutate({ items: unfinished, status: 'DONE' })
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg border border-emerald-300 dark:border-emerald-700/60 transition-colors disabled:opacity-50 shrink-0"
                      title="Xác nhận đã bưng toàn bộ đồ uống ra bàn"
                    >
                      <CheckCheck size={14} />
                      <span>Ra tất cả</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {order.items.map(item => {
                    const isDone = item.status === 'DONE'
                    const isPending = item.status === 'PENDING'
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isDone
                            ? 'bg-white/80 dark:bg-brand-900/60 border-brand-200 dark:border-brand-800 opacity-80'
                            : 'bg-white dark:bg-brand-800 border-amber-200 dark:border-amber-700/60 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm text-brand-900 dark:text-brand-100">
                              {item.quantity}x {item.product?.name}
                            </span>
                            {item.note && (
                              <p className="text-xs text-red-500 dark:text-red-400 italic mt-0.5">
                                Lưu ý: {item.note}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {itemStatusLabel(item.status)}
                            </span>

                            {!isDone && (
                              <button
                                type="button"
                                disabled={updateItemStatus.isPending}
                                onClick={() => updateItemStatus.mutate({ item, status: 'DONE' })}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                title="Xác nhận món này đã bưng ra bàn"
                              >
                                <CheckCircle2 size={13} />
                                <span>Ra món</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`h-10 rounded-xl text-xs font-bold transition-all border ${paymentMethod === m.value
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                        : 'bg-white dark:bg-brand-800 border-brand-200/80 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="flex flex-col items-center gap-3 p-3.5 bg-white dark:bg-brand-900 rounded-2xl border border-brand-200/80 dark:border-brand-700 shadow-sm text-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-md border border-brand-100 dark:border-brand-800 flex items-center justify-center">
                    <QRCode
                      size={135}
                      value={`BOMCOFFEE|BAN:${table?.name || numericTableId}|TIEN:${Math.round(totalAmount)}|BANK_TRANSFER`}
                      level="M"
                    />
                  </div>
                  <div className="w-full space-y-1.5 pt-1 text-xs border-t border-brand-100 dark:border-brand-800">
                    <div className="flex justify-between items-center text-brand-500 dark:text-brand-400 font-medium">
                      <span>Ngân hàng:</span>
                      <span className="font-bold text-brand-900 dark:text-brand-100">MB Bank (Quân Đội)</span>
                    </div>
                    <div className="flex justify-between items-center text-brand-500 dark:text-brand-400 font-medium">
                      <span>Số tài khoản:</span>
                      <span className="font-mono font-bold text-brand-900 dark:text-brand-100">038 888 8888</span>
                    </div>
                    <div className="flex justify-between items-center text-brand-500 dark:text-brand-400 font-medium">
                      <span>Chủ tài khoản:</span>
                      <span className="font-bold text-brand-900 dark:text-brand-100 uppercase tracking-wide">BOM COFFEE</span>
                    </div>
                  </div>
                </div>
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
            <div className={`grid ${order ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              {order && (
                <Button
                  variant="outline"
                  className="w-full h-11 border-brand-300 dark:border-brand-700 text-brand-800 dark:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-800 font-bold shadow-sm px-1 text-xs"
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate()}
                >
                  {checkout.isPending
                    ? 'Đang xử lý...'
                    : payTiming === 'BEFORE'
                      ? 'Trả bàn'
                      : 'Thanh toán & trả bàn'}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full h-11 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 font-bold shadow-sm flex items-center justify-center gap-1.5 text-xs"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Xuất hóa đơn
              </Button>
            </div>
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

      <InvoicePrint
        table={table}
        customerName={customerName}
        cartItems={cart}
        orderItems={order?.items || []}
        billiardSessions={order?.billiardSessions || []}
        liveBilliard={liveBilliard}
        totalAmount={totalAmount}
      />
    </>
  )
}
