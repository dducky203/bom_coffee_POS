import { useState } from "react";
import { useOrder } from "../context/OrderContext";
import { Wallet, Printer, Percent, DollarSign, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import {
  calculateBilliardCost,
  formatPlayTime,
  billiardPricing,
} from "../data/billiardData";

const PaymentSection = ({ tableId }) => {
  const { getTable, calculateTotal, updateDiscount, completePayment } =
    useOrder();
  const table = getTable(tableId);

  const [discount, setDiscount] = useState(table?.discount || 0);
  const [discountType, setDiscountType] = useState(
    table?.discountType || "percent",
  );
  const [showQRModal, setShowQRModal] = useState(false);

  if (!table) return null;

  // Tính tiền đồ uống
  const subtotal = table.orders.reduce((sum, order) => {
    const toppingPrice = order.options.toppings.reduce(
      (t, topping) => t + topping.price,
      0,
    );
    return sum + (order.price + toppingPrice) * order.quantity;
  }, 0);

  // Tính tiền giờ chơi bi-a (nếu có)
  const billiardCost =
    table.type === "billiard" && table.startTime
      ? calculateBilliardCost(
          table.startTime,
          table.endTime,
          table.billiardType,
        )
      : 0;

  const discountAmount =
    discountType === "percent" ? subtotal * (discount / 100) : discount;

  const orderTotal = Math.max(0, subtotal - discountAmount);
  const total = orderTotal + billiardCost;

  const handleDiscountChange = (value, type) => {
    setDiscount(value);
    setDiscountType(type);
    updateDiscount(tableId, value, type);
  };

  const handleShowQR = () => {
    // Cho phép thanh toán nếu có order hoặc có billiard cost
    if (table.orders.length === 0 && billiardCost === 0) {
      return;
    }
    setShowQRModal(true);
  };

  const handlePayment = () => {
    completePayment(tableId);
    setShowQRModal(false);
  };

  const handlePrintBill = () => {
    const billContent = `
      ═══════════════════════════════════
      ☕ COFFEE & BILLIARD ORDER SYSTEM
      ═══════════════════════════════════
      ${table.name} ${table.type === "billiard" ? `(${billiardPricing[table.billiardType].name})` : ""}
      ${new Date().toLocaleString("vi-VN")}
      ───────────────────────────────────
      ${
        table.type === "billiard" && table.startTime
          ? `
      🎱 BILLIARD
      Thời gian: ${formatPlayTime(table.startTime, table.endTime)}
      Giá: ${billiardPricing[table.billiardType].pricePerHour.toLocaleString("vi-VN")}đ/giờ
      Tiền giờ: ${billiardCost.toLocaleString("vi-VN")}đ
      ───────────────────────────────────
      `
          : ""
      }
      🍹 ĐỒ UỐNG
      ${
        table.orders.length > 0
          ? table.orders
              .map((order, i) => {
                const toppingPrice = order.options.toppings.reduce(
                  (t, tp) => t + tp.price,
                  0,
                );
                const itemTotal = (order.price + toppingPrice) * order.quantity;
                return `${i + 1}. ${order.name}
         x${order.quantity} - ${itemTotal.toLocaleString("vi-VN")}đ
         ${order.options.toppings.length > 0 ? `   + ${order.options.toppings.map((t) => t.name).join(", ")}` : ""}
         ${order.options.note ? `   Ghi chú: ${order.options.note}` : ""}`;
              })
              .join("\n")
          : "   (Không có)"
      }
      
      ───────────────────────────────────
      ${table.type === "billiard" && billiardCost > 0 ? `Tiền giờ: ${billiardCost.toLocaleString("vi-VN")}đ\n      ` : ""}Tạm tính đồ uống: ${subtotal.toLocaleString("vi-VN")}đ
      Giảm giá: -${discountAmount.toLocaleString("vi-VN")}đ
      ═══════════════════════════════════
      TỔNG CỘNG: ${total.toLocaleString("vi-VN")}đ
      ═══════════════════════════════════
      
      Cảm ơn quý khách!
      Hẹn gặp lại ☕🎱
    `;

    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Hoá Đơn - ${table.name}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              white-space: pre-wrap;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${billContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <div className="card p-6 sticky top-24">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          Thanh Toán
        </h3>

        {/* Summary */}
        <div className="space-y-3 mb-6">
          {/* Billiard Cost - Nếu là bàn bi-a */}
          {table.type === "billiard" && table.startTime && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  🎱 Giờ chơi Bi-a:
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {billiardCost.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                <div className="flex justify-between">
                  <span>{billiardPricing[table.billiardType].name}:</span>
                  <span>
                    {billiardPricing[
                      table.billiardType
                    ].pricePerHour.toLocaleString("vi-VN")}
                    đ/giờ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian:</span>
                  <span className="font-mono">
                    {formatPlayTime(table.startTime, table.endTime)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>{table.type === "billiard" ? "Đồ uống:" : "Tạm tính:"}</span>
            <span className="font-semibold">
              {subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>

          {/* Discount Input */}
          <div className="border-t dark:border-gray-700 pt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Giảm giá:
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handleDiscountChange(discount, "percent")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  discountType === "percent"
                    ? "bg-coffee-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Percent className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDiscountChange(discount, "fixed")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  discountType === "fixed"
                    ? "bg-coffee-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                VNĐ
              </button>
            </div>
            <input
              type="number"
              value={discount}
              onChange={(e) =>
                handleDiscountChange(Number(e.target.value), discountType)
              }
              className="input w-full"
              placeholder="0"
              min="0"
              max={discountType === "percent" ? 100 : subtotal}
            />
          </div>

          <div className="flex justify-between text-red-600 dark:text-red-400">
            <span>Giảm giá:</span>
            <span className="font-semibold">
              -{discountAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>

          <div className="border-t-2 border-coffee-600 dark:border-coffee-400 pt-3 flex justify-between text-xl font-bold text-coffee-700 dark:text-coffee-300">
            <span>Tổng cộng:</span>
            <span>{total.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleShowQR}
            disabled={table.orders.length === 0 && billiardCost === 0}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Thanh Toán QR Code
          </button>

          <button
            onClick={handlePrintBill}
            disabled={table.orders.length === 0 && billiardCost === 0}
            className="btn-secondary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            In Hoá Đơn
          </button>
        </div>

        {/* Order Stats */}
        {table.orders.length > 0 && (
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Tổng món:</span>
                <span className="font-semibold">{table.orders.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="card max-w-md w-full p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Quét Mã Thanh Toán
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {table.name} - {total.toLocaleString("vi-VN")}đ
              </p>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-xl inline-block mb-6">
                <QRCode
                  value={`https://payment.coffee-pos.vn/pay?table=${tableId}&amount=${total}&ref=${Date.now()}`}
                  size={256}
                  level="H"
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Sử dụng app ngân hàng để quét mã QR
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Xác Nhận Đã Thanh Toán
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="btn-secondary px-6 py-3"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentSection;
