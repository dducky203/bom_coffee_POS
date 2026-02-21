import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { menuData, categories } from "../data/menuData";
import MenuItemCard from "../components/MenuItemCard";
import MenuItemModal from "../components/MenuItemModal";
import OrderList from "../components/OrderList";
import PaymentSection from "../components/PaymentSection";
import MobilePayment from "../components/MobilePayment";
import TableSelector from "../components/TableSelector";
import BilliardTimer from "../components/BilliardTimer";
import { Search, ShoppingBag, ClipboardList } from "lucide-react";

const OrderPage = () => {
  const location = useLocation();
  const { getTable, addOrderItem } = useOrder();

  const [selectedTableId, setSelectedTableId] = useState(
    location.state?.selectedTableId || 1,
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (location.state?.selectedTableId) {
      setSelectedTableId(location.state.selectedTableId);
    }
  }, [location.state]);

  const table = getTable(selectedTableId);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleAddItem = (orderItem) => {
    addOrderItem(selectedTableId, orderItem);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Table Selector */}
      <TableSelector
        selectedTableId={selectedTableId}
        onSelectTable={setSelectedTableId}
      />

      {/* Header */}
      {table && (
        <div className="card p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                {table.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                Chọn món để bắt đầu order
              </p>
            </div>
            {table.orders.length > 0 && (
              <div className="bg-coffee-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-lg flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {table.orders.length} món
                </span>
                <span className="sm:hidden">{table.orders.length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {table && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Menu Section */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Billiard Timer - Chỉ hiển thị cho bàn bi-a */}
            {table.type === "billiard" && (
              <BilliardTimer tableId={selectedTableId} />
            )}

            {/* Menu Section - Hiển thị title khác cho bàn bi-a */}
            {table.type === "billiard" && (
              <div className="card p-3 sm:p-4 bg-mint-100 dark:bg-mint-900/20">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg">
                  🍹 Order Đồ Uống
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Chọn đồ uống cho bàn {table.name}
                </p>
              </div>
            )}

            {/* Search */}
            <div className="card p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm món..."
                  className="input w-full text-base sm:text-lg pl-9 sm:pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="card p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all snap-start flex-shrink-0 text-sm sm:text-base ${
                      selectedCategory === cat.id
                        ? "bg-coffee-600 text-white shadow-lg scale-105"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-lg sm:text-xl">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            {showSkeleton ? (
              <div className="space-y-2.5 sm:space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="card p-2.5 sm:p-3 animate-pulse flex gap-2.5 sm:gap-3"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {menuData
                  .filter((item) => {
                    const matchCategory =
                      selectedCategory === "all" ||
                      item.category === selectedCategory;
                    const matchSearch =
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      item.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    return matchCategory && matchSearch;
                  })
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectItem}
                    />
                  ))}
              </div>
            )}

            {menuData.filter((item) => {
              const matchCategory =
                selectedCategory === "all" ||
                item.category === selectedCategory;
              const matchSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
              return matchCategory && matchSearch;
            }).length === 0 &&
              !showSkeleton && (
                <div className="card p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Không tìm thấy món nào
                  </p>
                </div>
              )}
          </div>

          {/* Right: Order & Payment Section */}
          <div className="hidden lg:block space-y-6">
            <div className="card p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ClipboardList className="w-6 h-6" />
                Danh Sách Order
              </h3>
              <OrderList tableId={selectedTableId} orders={table.orders} />
            </div>

            <PaymentSection tableId={selectedTableId} />
          </div>

          {/* Mobile Bottom Sheet for Order & Payment */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
            <MobilePayment tableId={selectedTableId} />
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
};

export default OrderPage;
