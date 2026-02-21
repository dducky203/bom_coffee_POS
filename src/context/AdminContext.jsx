import { createContext, useContext, useState, useEffect } from "react";

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};

const ADMIN_STORAGE_KEY = "admin_data";
const AUTH_STORAGE_KEY = "auth_user";

export const AdminProvider = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Admin data
  const [adminData, setAdminData] = useState(() => {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // Default admin data
    return {
      users: [
        {
          id: 1,
          username: "admin",
          password: "admin123", // In production, use hashed passwords
          fullName: "Administrator",
          role: "admin",
          email: "admin@coffee.com",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          username: "staff",
          password: "staff123",
          fullName: "Staff User",
          role: "staff",
          email: "staff@coffee.com",
          createdAt: new Date().toISOString(),
        },
      ],
      invoiceHistory: [], // { id, tableId, tableName, items, total, timestamp, paymentMethod }
    };
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
  }, [adminData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  // Auth functions
  const login = (username, password) => {
    const user = adminData.users.find(
      (u) => u.username === username && u.password === password,
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }

    return {
      success: false,
      message: "Tên đăng nhập hoặc mật khẩu không đúng",
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const isAdmin = () => {
    return currentUser?.role === "admin";
  };

  const isStaff = () => {
    return currentUser?.role === "staff";
  };

  // User Management
  const addUser = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
    };
    setAdminData((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    return newUser;
  };

  const updateUser = (userId, updates) => {
    setAdminData((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user,
      ),
    }));
  };

  const deleteUser = (userId) => {
    setAdminData((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== userId),
    }));
  };

  // Invoice History
  const addInvoice = (invoice) => {
    const newInvoice = {
      id: Date.now(),
      ...invoice,
      timestamp: new Date().toISOString(),
      createdBy: currentUser?.fullName || "Unknown",
    };
    setAdminData((prev) => ({
      ...prev,
      invoiceHistory: [newInvoice, ...prev.invoiceHistory],
    }));
    return newInvoice;
  };

  const getInvoicesByDate = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return adminData.invoiceHistory.filter((invoice) => {
      const invoiceDate = new Date(invoice.timestamp);
      return invoiceDate >= startOfDay && invoiceDate <= endOfDay;
    });
  };

  const getRevenueByDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return adminData.invoiceHistory.filter((invoice) => {
      const invoiceDate = new Date(invoice.timestamp);
      return invoiceDate >= start && invoiceDate <= end;
    });
  };

  const getDailyRevenue = (days = 7) => {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayInvoices = getInvoicesByDate(date);
      const total = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);

      result.push({
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        fullDate: date.toISOString(),
        total,
        count: dayInvoices.length,
      });
    }

    return result;
  };

  const getMonthlyRevenue = (months = 6) => {
    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthInvoices = getRevenueByDateRange(startOfMonth, endOfMonth);
      const total = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);

      result.push({
        month: date.toLocaleDateString("vi-VN", {
          month: "2-digit",
          year: "numeric",
        }),
        fullDate: date.toISOString(),
        total,
        count: monthInvoices.length,
      });
    }

    return result;
  };

  const value = {
    currentUser,
    adminData,
    login,
    logout,
    isAdmin,
    isStaff,
    addUser,
    updateUser,
    deleteUser,
    addInvoice,
    getInvoicesByDate,
    getRevenueByDateRange,
    getDailyRevenue,
    getMonthlyRevenue,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
