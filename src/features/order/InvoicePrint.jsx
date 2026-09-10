import React from 'react'
import { formatCurrency, formatTimeOnly, formatPlayDuration } from '../../shared/lib/utils'
import { buildDrinkNote } from '../../shared/lib/drinkOptions'

export function InvoicePrint({ 
  table, 
  customerName, 
  cartItems = [], 
  orderItems = [], 
  billiardSessions = [], 
  liveBilliard = null, 
  totalAmount = 0,
  orderDate = null,
  orderId = null,
  discountAmount = 0,
}) {
  const printDate = orderDate ? new Date(orderDate) : new Date()

  // Món đã gửi (nếu có trong đơn hàng cũ, bỏ qua các món đã hủy)
  // cartItems: Món mới đang chọn
  const allItems = [
    ...orderItems
      .filter(item => item.status !== 'CANCELLED')
      .map(item => ({
        id: item.id,
        name: item.product?.name,
        quantity: item.quantity,
        price: item.unitPrice || (item.product?.basePrice),
        note: item.note,
        status: item.status
      })),
    ...cartItems.map(item => ({
      id: item.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.unitPrice || item.product.basePrice,
      note: buildDrinkNote({
        hasDrinkOptions: item.product.hasDrinkOptions !== false,
        ice: item.options?.ice ?? 100,
        sugar: item.options?.sugar ?? 100,
        toppings: item.toppings || [],
        extraNote: item.options?.extraNote,
      }),
      status: 'NEW'
    }))
  ]

  return (
    <div className="hidden print:block w-[80mm] p-2 bg-white text-black text-[12px] font-sans mx-auto h-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Bom Coffee</h1>
        <p className="text-[11px] mb-0.5">Địa chỉ: (Chưa cập nhật)</p>
        <p className="text-[11px] mb-2">SĐT: (Chưa cập nhật)</p>
        <h2 className="text-lg font-bold border-t border-b border-black py-1 my-2">HÓA ĐƠN THANH TOÁN</h2>
      </div>

      <div className="mb-4 text-[12px] space-y-1">
        <div className="flex justify-between">
          <span>Bàn: <span className="font-bold">{table?.name || 'Mang đi'}</span></span>
          <span>{formatTimeOnly(printDate)} {printDate.toLocaleDateString('vi-VN')}</span>
        </div>
        {orderId && (
          <div className="flex justify-between text-gray-700">
            <span>Mã hóa đơn:</span>
            <span className="font-bold font-mono">#{orderId}</span>
          </div>
        )}
        {customerName && (
          <div>Khách hàng: <span className="font-bold">{customerName}</span></div>
        )}
      </div>

      {(billiardSessions.length > 0 || liveBilliard) && (
        <div className="mb-4">
          <h3 className="font-bold border-b border-dashed border-black pb-1 mb-1">Tiền Giờ Bi-a</h3>
          {billiardSessions.map(session => (
            <div key={session.id} className="flex justify-between py-1 border-b border-dotted border-gray-300">
              <div className="flex-1">
                <div>Phiên {session.sessionNo || session.id}</div>
                <div className="text-[10px]">
                  {formatTimeOnly(session.startTime)} - {formatTimeOnly(session.endTime)}
                </div>
              </div>
              <div className="font-bold">
                {formatCurrency(session.totalAmount)}
              </div>
            </div>
          ))}
          {liveBilliard && (
            <div className="flex justify-between py-1">
              <div className="flex-1">
                <div>Giờ đang chơi</div>
                <div className="text-[10px]">
                  Bắt đầu: {formatTimeOnly(liveBilliard.startTime)}
                </div>
              </div>
              <div className="font-bold">
                {formatCurrency(liveBilliard.currentAmount)}
              </div>
            </div>
          )}
        </div>
      )}

      {allItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold border-b border-dashed border-black pb-1 mb-1">Dịch vụ (F&B)</h3>
          <div className="w-full">
            {allItems.map((item, idx) => (
              <div key={idx} className="py-1 border-b border-dotted border-gray-300">
                <div className="flex justify-between">
                  <span className="font-semibold flex-1 pr-1">{item.name} {item.status === 'NEW' ? '(Mới)' : ''}</span>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-16 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                {item.note && <div className="text-[10px] text-gray-600 pl-2">- {item.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-black pt-2 mb-6">
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-xs pb-1">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold">
          <span>TỔNG CỘNG:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="text-center text-[11px] mb-8">
        <p className="font-bold italic mb-1">Cảm ơn quý khách và hẹn gặp lại!</p>
        <p>Password Wifi: bomcoffee123</p>
      </div>
      
      {/* Spacer for paper cut margin */}
      <div className="h-4"></div>
    </div>
  )
}
