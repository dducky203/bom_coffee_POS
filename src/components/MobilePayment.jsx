import { useState } from "react";
import { useOrder } from "../context/OrderContext";
import { Wallet, QrCode, ChevronUp } from "lucide-react";
import QRCode from "react-qr-code";
import OrderList from "./OrderList";
import { calculateBilliardCost } from "../data/billiardData";

const MobilePayment = ({ tableId }) => {
  const { getTable, completePayment } = useOrder();
  const table = getTable(tableId);

  const [showQRModal, setShowQRModal] = useState(false);
  const [showFullOrder, setShowFullOrder] = useState(false);

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
    table.discountType === "percent"
      ? subtotal * (table.discount / 100)
      : table.discount;

  const orderTotal = Math.max(0, subtotal - discountAmount);
  const total = orderTotal + billiardCost;

  const handleShowQR = () => {
    // Cho phép thanh toán nếu có order hoặc có billiard cost
    if (table.orders.length === 0 && billiardCost === 0) return;
    setShowQRModal(true);
  };

  const handlePayment = () => {
    completePayment(tableId);
    setShowQRModal(false);
  };

  return (
    <>
      {/* Compact Bottom Bar */}
      <div className="bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Total */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tổng cộng
              </p>
              <p className="text-xl font-bold text-coffee-600 dark:text-coffee-400">
                {total.toLocaleString("vi-VN")}đ
              </p>
            </div>

            {/* Payment Button */}
            <button
              onClick={handleShowQR}
              disabled={table.orders.length === 0 && billiardCost === 0}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Thanh Toán</span>
            </button>
          </div>

          {/* Order Summary Toggle */}
          {table.orders.length > 0 && (
            <button
              onClick={() => setShowFullOrder(!showFullOrder)}
              className="w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span className="text-sm">
                {showFullOrder ? "Ẩn" : "Xem"} đơn hàng ({table.orders.length}{" "}
                món)
              </span>
              <ChevronUp
                className={`w-4 h-4 transition-transform ${showFullOrder ? "rotate-0" : "rotate-180"}`}
              />
            </button>
          )}
        </div>

        {/* Full Order Sheet */}
        {showFullOrder && (
          <div className="border-t border-gray-200 dark:border-gray-700 max-h-[50vh] overflow-y-auto">
            <div className="container mx-auto px-4 py-4">
              <OrderList tableId={tableId} orders={table.orders} />
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
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Quét Mã Thanh Toán
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                {table.name} - {total.toLocaleString("vi-VN")}đ
              </p>

              {/* QR Code */}
              <div className="bg-white p-4 sm:p-6 rounded-xl inline-block mb-6">
                <QRCode
                  value={`https://payment.coffee-pos.vn/pay?table=${tableId}&amount=${total}&ref=${Date.now()}`}
                  size={200}
                  level="H"
                />
              </div>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">
                Sử dụng app ngân hàng để quét mã QR
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Wallet className="w-5 h-5" />
                  Xác Nhận Thanh Toán
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="btn-secondary px-6 py-3 text-sm sm:text-base"
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

export default MobilePayment;
