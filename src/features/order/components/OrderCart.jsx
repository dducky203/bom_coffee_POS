import { Ban, CheckCheck, CheckCircle2, Minus, MoreHorizontal, PanelRightClose, Plus, Printer, ShoppingBag, Trash2, X } from 'lucide-react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { buildDrinkNote } from '../../../shared/lib/drinkOptions'
import { durationSecondsBetween, formatCurrency, formatPlayDuration, formatTimeOnly } from '../../../shared/lib/utils'

export function OrderCart({
  isCartOpen, setIsCartOpen, isDesktopCartVisible, setIsDesktopCartVisible,
  cart, table, customerName, setCustomerName, order, showCartOptions, setShowCartOptions,
  setShowCancelOrderModal, cancelWholeOrder, isBilliard, finishedSessions, liveBilliard,
  startBilliard, stopBilliard, playingElapsed, now, activeOrderItems, cancelledOrderItems,
  updateAllItemsStatus, cancelOrderItem, setCancelItemTarget, updateItemStatus, itemStatusLabel,
  removeItem, changeQty, error, totalAmount, payTiming, setPayTiming, paymentMethod, setPaymentMethod,
  PAYMENT_METHODS, sendOrder, checkout, numericTableId
}) {
  const handlePrint = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setTimeout(() => {
      try {
        window.print()
      } catch (err) {
        console.error('Print failed', err)
      }
    }, 50)
  }
  return (
    <>
      {isCartOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      {/* Cart Container */}
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

              <div className="flex items-center gap-1">
                {order && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCartOptions(v => !v)}
                      className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 dark:hover:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-700 transition-colors"
                      title="Tùy chọn"
                      aria-label="Tùy chọn đơn"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {showCartOptions && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-10 cursor-default"
                          aria-label="Đóng tùy chọn"
                          onClick={() => setShowCartOptions(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-900 shadow-lg py-1 overflow-hidden">
                          <button
                            type="button"
                            disabled={cancelWholeOrder.isPending}
                            onClick={() => {
                              setShowCartOptions(false)
                              setShowCancelOrderModal(true)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                          >
                            <Ban size={14} />
                            Hủy cả đơn
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

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
                      Món đã gửi bếp ({activeOrderItems.length})
                    </p>
                  </div>
                  {activeOrderItems.some(i => i.status !== 'DONE' && i.status !== 'SERVED') && (
                    <button
                      type="button"
                      disabled={updateAllItemsStatus.isPending}
                      onClick={() => {
                        const unfinished = activeOrderItems.filter(i => i.status !== 'DONE' && i.status !== 'SERVED')
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
                  {activeOrderItems.map(item => {
                    const isDone = item.status === 'DONE' || item.status === 'SERVED'
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

                            <button
                              type="button"
                              disabled={cancelOrderItem.isPending}
                              onClick={() => setCancelItemTarget(item)}
                              className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                              title="Hủy món (hết hàng / khách đổi món)"
                              aria-label="Hủy món"
                            >
                              <X size={15} strokeWidth={2.5} />
                            </button>

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

                  {cancelledOrderItems.length > 0 && (
                    <div className="pt-1 space-y-1.5 border-t border-dashed border-brand-200 dark:border-brand-700">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-400">
                        Đã hủy ({cancelledOrderItems.length})
                      </p>
                      {cancelledOrderItems.map(item => (
                        <div
                          key={item.id}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-100/40 dark:bg-brand-900/30 border border-brand-200/50 dark:border-brand-800 opacity-60"
                        >
                          <span className="text-xs text-brand-500 line-through">
                            {item.quantity}x {item.product?.name}
                          </span>
                          <span className="ml-2 text-[10px] font-bold text-red-500">Đã hủy</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <img
                      src="/images/qr.png"
                      alt="QR thanh toán"
                      className="w-[135px] h-[135px] object-contain"
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
                onClick={handlePrint}
              >
                <Printer size={16} />
                Xuất hóa đơn
              </Button>
            </div>
          </div>
        </div>
    </>
  )
}
