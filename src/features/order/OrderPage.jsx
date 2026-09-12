import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, CheckCheck, CheckCircle2, ChevronLeft, Coffee, Flame, Minus, MoreHorizontal, PanelRightClose, PanelRightOpen, Plus, Printer, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCartStore } from '../../app/store'
import { Badge } from '../../shared/components/Badge'
import { Button } from '../../shared/components/Button'
import { LoadingPage } from '../../shared/components/Loading'
import { Modal } from '../../shared/components/Modal'
import { billiardApi, kdsApi, orderApi } from '../../shared/lib/api'
import { buildDrinkNote } from '../../shared/lib/drinkOptions'
import { categoriesQuery, productsQuery, tablesQuery, toppingsQuery } from '../../shared/lib/queries'
import { durationSecondsBetween, formatCurrency, formatPlayDuration, formatTimeOnly, liveElapsedSeconds } from '../../shared/lib/utils'
import { OrderHeader } from './components/OrderHeader'
import { ProductList } from './components/ProductList'
import { OrderCart } from './components/OrderCart'
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
    case 'CANCELLED': return 'Đã hủy'
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
  const [cancelItemTarget, setCancelItemTarget] = useState(null)
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false)
  const [showCartOptions, setShowCartOptions] = useState(false)

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

  const cancelOrderItem = useMutation({
    mutationFn: (itemId) => orderApi.cancelItem(order.id, itemId),
    onSuccess: async () => {
      setCancelItemTarget(null)
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['order-by-table', numericTableId] })
      await queryClient.invalidateQueries({ queryKey: ['kds-queue'] })
    },
    onError: (err) => setError(err.message),
  })

  const cancelWholeOrder = useMutation({
    mutationFn: () => orderApi.cancelOrder(order.id),
    onSuccess: async () => {
      setShowCancelOrderModal(false)
      setError('')
      clearCart()
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      await queryClient.invalidateQueries({ queryKey: ['kds-queue'] })
      await queryClient.invalidateQueries({ queryKey: ['billiard-current', numericTableId] })
      navigate('/')
    },
    onError: (err) => setError(err.message),
  })

  const activeOrderItems = useMemo(
    () => (order?.items || []).filter(i => i.status !== 'CANCELLED'),
    [order]
  )
  const cancelledOrderItems = useMemo(
    () => (order?.items || []).filter(i => i.status === 'CANCELLED'),
    [order]
  )
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
  const playingElapsed = liveElapsedSeconds(liveBilliard?.startTime, now, liveBilliard?.elapsedSeconds)
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
          <OrderHeader
            table={table}
            customerName={customerName}
            cartItemCount={cart.length}
            isDesktopCartVisible={isDesktopCartVisible}
            setIsDesktopCartVisible={setIsDesktopCartVisible}
          />

          <ProductList
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            allProducts={allProducts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredProducts={filteredProducts}
            isDesktopCartVisible={isDesktopCartVisible}
            setSelectedProduct={setSelectedProduct}
          />

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

        <OrderCart
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          isDesktopCartVisible={isDesktopCartVisible}
          setIsDesktopCartVisible={setIsDesktopCartVisible}
          cart={cart}
          table={table}
          customerName={customerName}
          setCustomerName={setCustomerName}
          order={order}
          showCartOptions={showCartOptions}
          setShowCartOptions={setShowCartOptions}
          setShowCancelOrderModal={setShowCancelOrderModal}
          cancelWholeOrder={cancelWholeOrder}
          isBilliard={isBilliard}
          finishedSessions={finishedSessions}
          liveBilliard={liveBilliard}
          startBilliard={startBilliard}
          stopBilliard={stopBilliard}
          playingElapsed={playingElapsed}
          now={now}
          activeOrderItems={activeOrderItems}
          cancelledOrderItems={cancelledOrderItems}
          updateAllItemsStatus={updateAllItemsStatus}
          cancelOrderItem={cancelOrderItem}
          setCancelItemTarget={setCancelItemTarget}
          updateItemStatus={updateItemStatus}
          itemStatusLabel={itemStatusLabel}
          removeItem={removeItem}
          changeQty={changeQty}
          error={error}
          totalAmount={totalAmount}
          payTiming={payTiming}
          setPayTiming={setPayTiming}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          PAYMENT_METHODS={PAYMENT_METHODS}
          sendOrder={sendOrder}
          checkout={checkout}
          numericTableId={numericTableId}
        />

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

      <Modal
        isOpen={!!cancelItemTarget}
        onClose={() => setCancelItemTarget(null)}
        title="Hủy món đã gửi bếp?"
        subtitle="Dùng khi hết hàng hoặc khách muốn đổi món khác"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelItemTarget(null)}>
              Không
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              disabled={cancelOrderItem.isPending}
              onClick={() => cancelOrderItem.mutate(cancelItemTarget.id)}
            >
              {cancelOrderItem.isPending ? 'Đang hủy...' : 'Xác nhận hủy món'}
            </Button>
          </div>
        }
      >
        {cancelItemTarget && (
          <p className="text-sm text-brand-700 dark:text-brand-200">
            Hủy <span className="font-bold">{cancelItemTarget.quantity}x {cancelItemTarget.product?.name}</span>.
            Món sẽ biến mất khỏi KDS, tiền sẽ được trừ khỏi hóa đơn. Khách có thể order món khác ngay sau đó.
          </p>
        )}
      </Modal>

      <Modal
        isOpen={showCancelOrderModal}
        onClose={() => setShowCancelOrderModal(false)}
        title="Hủy cả đơn hàng?"
        subtitle="Khách muốn về / không dùng bàn nữa"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelOrderModal(false)}>
              Giữ đơn
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              disabled={cancelWholeOrder.isPending}
              onClick={() => cancelWholeOrder.mutate()}
            >
              {cancelWholeOrder.isPending ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-brand-700 dark:text-brand-200">
          <p>Toàn bộ món chưa thanh toán sẽ bị hủy, bàn <span className="font-bold">{table?.name}</span> sẽ trống lại.</p>
          {isBilliard && (
            <p className="text-amber-700 dark:text-amber-300 font-medium">
              Phiên bi-a đang chơi (nếu có) sẽ kết thúc và không tính tiền.
            </p>
          )}
          <p className="text-xs text-brand-500">Đơn hủy vẫn lưu trong lịch sử với trạng thái &quot;Đã hủy&quot;.</p>
        </div>
      </Modal>

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
