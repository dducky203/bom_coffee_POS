import { useState } from "react";
import { useOrder } from "../context/OrderContext";
import { Edit2, Trash2, Save, X } from "lucide-react";

const OrderList = ({ tableId, orders }) => {
  const { updateOrderItem, removeOrderItem } = useOrder();
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);

  const handleEdit = (order) => {
    setEditingId(order.id);
    setEditQuantity(order.quantity);
  };

  const handleSaveEdit = (orderId) => {
    updateOrderItem(tableId, orderId, { quantity: editQuantity });
    setEditingId(null);
  };

  const getItemTotal = (order) => {
    const toppingPrice = order.options.toppings.reduce(
      (sum, t) => sum + t.price,
      0,
    );
    return (order.price + toppingPrice) * order.quantity;
  };

  const getSugarLabel = (value) => {
    const labels = { 0: "0%", 50: "50%", 100: "100%" };
    return labels[value] || `${value}%`;
  };

  const getIceLabel = (value) => {
    const labels = {
      none: "Không đá",
      less: "Ít đá",
      normal: "Bình thường",
    };
    return labels[value] || value;
  };

  if (orders.length === 0) {
    return (
      <div className="card p-6 sm:p-8 text-center">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🍽️</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg">
          Chưa có món nào được order
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="card p-3 sm:p-4 animate-fade-in">
          <div className="flex justify-between items-start gap-2 sm:gap-4">
            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg truncate">
                  {order.name}
                </h3>
              </div>

              {/* Options */}
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1">
                <div className="flex gap-2 sm:gap-4">
                  <span>🍬 Đường: {getSugarLabel(order.options.sugar)}</span>
                  <span>🧊 Đá: {getIceLabel(order.options.ice)}</span>
                </div>

                {order.options.toppings.length > 0 && (
                  <div>
                    <span className="font-medium">Topping: </span>
                    {order.options.toppings.map((t) => t.name).join(", ")}
                  </div>
                )}

                {order.options.note && (
                  <div>
                    <span className="font-medium">Ghi chú: </span>
                    <span className="italic">{order.options.note}</span>
                  </div>
                )}
              </div>

              {/* Price & Quantity */}
              <div className="mt-2 sm:mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  {editingId === order.id ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() =>
                          setEditQuantity(Math.max(1, editQuantity - 1))
                        }
                        className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="font-bold w-8 text-center text-sm sm:text-base">
                        {editQuantity}
                      </span>
                      <button
                        onClick={() => setEditQuantity(editQuantity + 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleSaveEdit(order.id)}
                        className="p-2.5 sm:p-2 bg-green-500 text-white rounded hover:bg-green-600 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2.5 sm:p-2 bg-gray-500 text-white rounded hover:bg-gray-600 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                      SL: {order.quantity}
                    </span>
                  )}
                </div>

                <span className="text-base sm:text-lg font-bold text-coffee-600 dark:text-coffee-400">
                  {getItemTotal(order).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <button
                onClick={() => handleEdit(order)}
                className="p-2.5 sm:p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="Sửa"
              >
                <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => removeOrderItem(tableId, order.id)}
                className="p-2.5 sm:p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;
