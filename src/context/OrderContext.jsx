import { createContext, useContext, useState, useEffect } from "react";
import { calculateBilliardCost } from "../data/billiardData";
import { useAdmin } from "./AdminContext";

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return context;
};

const STORAGE_KEY = "coffee_order_data";

export const OrderProvider = ({ children }) => {
  // Safely use admin context (may be null if not wrapped)
  let adminContext = null;
  try {
    adminContext = useAdmin();
  } catch (e) {
    // AdminProvider not available, skip invoice saving
  }

  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsedData = JSON.parse(saved);
      // Kiểm tra nếu data cũ không có type field, reset localStorage
      if (parsedData.length > 0 && !parsedData[0].type) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        return parsedData;
      }
    }

    // Tạo 12 bàn cà phê
    const cafeTables = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Bàn ${i + 1}`,
      type: "cafe", // cafe | billiard
      status: "empty", // empty | ordering | payment
      orders: [],
      discount: 0,
      discountType: "percent", // percent | fixed
    }));

    // Tạo 6 bàn bi-a
    const billiardTables = Array.from({ length: 6 }, (_, i) => ({
      id: i + 13,
      name: `Bi-a ${i + 1}`,
      type: "billiard",
      billiardType: i < 4 ? "standard" : "vip", // standard | vip
      status: "empty",
      orders: [],
      discount: 0,
      discountType: "percent",
      startTime: null, // Thời gian bắt đầu chơi
      endTime: null, // Thời gian kết thúc
    }));

    return [...cafeTables, ...billiardTables];
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const getTable = (tableId) => {
    return tables.find((t) => t.id === parseInt(tableId));
  };

  const addOrderItem = (tableId, item) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === parseInt(tableId)) {
          const existingIndex = table.orders.findIndex(
            (o) =>
              o.itemId === item.itemId &&
              JSON.stringify(o.options) === JSON.stringify(item.options),
          );

          let newOrders;
          if (existingIndex >= 0) {
            newOrders = [...table.orders];
            newOrders[existingIndex] = {
              ...newOrders[existingIndex],
              quantity: newOrders[existingIndex].quantity + item.quantity,
            };
          } else {
            newOrders = [
              ...table.orders,
              {
                ...item,
                id: Date.now(),
              },
            ];
          }

          return {
            ...table,
            orders: newOrders,
            status: "ordering",
          };
        }
        return table;
      }),
    );
    showToast("✅ Đã thêm món vào order!", "success");
  };

  const updateOrderItem = (tableId, orderId, updates) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === parseInt(tableId)) {
          return {
            ...table,
            orders: table.orders.map((order) =>
              order.id === orderId ? { ...order, ...updates } : order,
            ),
          };
        }
        return table;
      }),
    );
    showToast("✏️ Đã cập nhật món!", "info");
  };

  const removeOrderItem = (tableId, orderId) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === parseInt(tableId)) {
          const newOrders = table.orders.filter(
            (order) => order.id !== orderId,
          );
          return {
            ...table,
            orders: newOrders,
            status: newOrders.length === 0 ? "empty" : table.status,
          };
        }
        return table;
      }),
    );
    showToast("🗑️ Đã xóa món!", "warning");
  };

  const calculateTotal = (tableId) => {
    const table = getTable(tableId);
    if (!table) return 0;

    // Tính tiền order đồ uống
    const subtotal = table.orders.reduce((sum, order) => {
      const toppingPrice = order.options.toppings.reduce(
        (t, topping) => t + topping.price,
        0,
      );
      return sum + (order.price + toppingPrice) * order.quantity;
    }, 0);

    const discountAmount =
      table.discountType === "percent"
        ? subtotal * (table.discount / 100)
        : table.discount;

    const orderTotal = Math.max(0, subtotal - discountAmount);

    // Nếu là bàn bi-a, cộng thêm tiền giờ chơi
    if (table.type === "billiard" && table.startTime) {
      const billiardCost = calculateBilliardCost(
        table.startTime,
        table.endTime,
        table.billiardType,
      );
      return orderTotal + billiardCost;
    }

    return orderTotal;
  };

  // Bắt đầu tính giờ cho bàn bi-a
  const startBilliard = (tableId) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === parseInt(tableId) && table.type === "billiard"
          ? {
              ...table,
              startTime: new Date().toISOString(),
              endTime: null,
              status: "ordering",
            }
          : table,
      ),
    );
    showToast("🎱 Bắt đầu tính giờ!", "success");
  };

  // Dừng tính giờ cho bàn bi-a
  const stopBilliard = (tableId) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === parseInt(tableId) && table.type === "billiard"
          ? {
              ...table,
              endTime: new Date().toISOString(),
              status: "payment",
            }
          : table,
      ),
    );
    showToast("⏸️ Dừng tính giờ!", "info");
  };

  const updateDiscount = (tableId, discount, discountType) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === parseInt(tableId)
          ? { ...table, discount, discountType }
          : table,
      ),
    );
  };

  const completePayment = (tableId) => {
    const table = getTable(tableId);
    if (!table) return;

    // Tính toán hóa đơn
    const { subtotal, discountAmount, total } = calculateTotal(tableId);
    let billiardCost = 0;

    if (table.type === "billiard" && table.startTime) {
      const endTime = table.endTime || new Date();
      billiardCost = calculateBilliardCost(
        table.startTime,
        endTime,
        table.billiardType,
      );
    }

    // Lưu invoice vào AdminContext nếu có
    if (adminContext && adminContext.addInvoice) {
      const invoice = {
        tableId: table.id,
        tableName: table.name,
        items: table.orders,
        subtotal,
        discount: discountAmount,
        billiardCost,
        total: total,
        paymentMethod: "QR",
        createdBy: adminContext.currentUser?.fullName || "Staff",
      };
      adminContext.addInvoice(invoice);
    }

    // Reset bàn
    setTables((prev) =>
      prev.map((table) =>
        table.id === parseInt(tableId)
          ? {
              ...table,
              status: "empty",
              orders: [],
              discount: 0,
              discountType: "percent",
              // Reset billiard timer nếu là bàn bi-a
              ...(table.type === "billiard" && {
                startTime: null,
                endTime: null,
              }),
            }
          : table,
      ),
    );
    showToast("💰 Thanh toán thành công!", "success");
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const value = {
    tables,
    toast,
    darkMode,
    getTable,
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    calculateTotal,
    updateDiscount,
    completePayment,
    startBilliard,
    stopBilliard,
    showToast,
    toggleDarkMode,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
