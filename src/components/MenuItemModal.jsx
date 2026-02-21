import { useState, useEffect } from "react";
import { toppings, sugarLevels, iceLevels } from "../data/menuData";
import { Plus, Minus, X as CloseIcon } from "lucide-react";

const MenuItemModal = ({ item, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState(100);
  const [ice, setIce] = useState("normal");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleEnter = (e) => {
      if (e.key === "Enter" && e.ctrlKey) handleAdd();
    };
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("keydown", handleEnter);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("keydown", handleEnter);
    };
  }, [quantity, sugar, ice, selectedToppings, note]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const calculateTotal = () => {
    const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return (item.price + toppingPrice) * quantity;
  };

  const handleAdd = () => {
    onAdd({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      options: {
        sugar,
        ice,
        toppings: selectedToppings,
        note,
      },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex-1 pr-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {item.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {item.description}
            </p>
            <p className="text-lg sm:text-xl font-bold text-coffee-600 dark:text-coffee-400 mt-2">
              {item.price.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 -mr-2"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Quantity */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Số Lượng
          </label>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="btn-secondary w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
            >
              <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 w-10 sm:w-12 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="btn-secondary w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Sugar Level */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Mức Đường
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {sugarLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSugar(level.value)}
                className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  sugar === level.value
                    ? "bg-coffee-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ice Level */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Mức Đá
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {iceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setIce(level.value)}
                className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  ice === level.value
                    ? "bg-mint-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Topping (có thể chọn nhiều)
          </label>
          <div className="space-y-2">
            {toppings.map((topping) => (
              <label
                key={topping.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all ${
                  selectedToppings.find((t) => t.id === topping.id)
                    ? "bg-coffee-100 dark:bg-coffee-900/30 border-2 border-coffee-600"
                    : "bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    checked={
                      !!selectedToppings.find((t) => t.id === topping.id)
                    }
                    onChange={() => toggleTopping(topping)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-coffee-600"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                    {topping.name}
                  </span>
                </div>
                <span className="text-coffee-600 dark:text-coffee-400 font-semibold text-sm sm:text-base">
                  +{topping.price.toLocaleString("vi-VN")}đ
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Ghi Chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Ít ngọt hơn, không có đá..."
            className="input w-full min-h-[60px] sm:min-h-[80px] resize-none text-sm sm:text-base"
          />
        </div>

        {/* Total & Actions */}
        <div className="border-t dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
              Tổng Cộng:
            </span>
            <span className="text-xl sm:text-2xl font-bold text-coffee-600 dark:text-coffee-400">
              {calculateTotal().toLocaleString("vi-VN")}đ
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary w-full py-3 text-base sm:text-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">
              Thêm Vào Order (Ctrl+Enter)
            </span>
            <span className="sm:hidden">Thêm Vào Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
