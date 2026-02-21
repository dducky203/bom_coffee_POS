import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import {
  LayoutDashboard,
  Users,
  Coffee,
  CircleDollarSign,
  FileText,
  LogOut,
  Menu,
  X,
  Armchair,
  TrendingUp,
} from "lucide-react";

// Import admin components (will create these)
import UserManagement from "../components/admin/UserManagement";
import MenuManagement from "../components/admin/MenuManagement";
import TableManagement from "../components/admin/TableManagement";
import PriceManagement from "../components/admin/PriceManagement";
import RevenueStatistics from "../components/admin/RevenueStatistics";
import InvoiceHistory from "../components/admin/InvoiceHistory";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState("statistics");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not admin
  if (!currentUser || !isAdmin()) {
    navigate("/login");
    return null;
  }

  const tabs = [
    { id: "statistics", name: "Thống Kê", icon: TrendingUp },
    { id: "invoices", name: "Hóa Đơn", icon: FileText },
    { id: "menu", name: "Quản Lý Món", icon: Coffee },
    { id: "tables", name: "Quản Lý Bàn", icon: Armchair },
    { id: "prices", name: "Quản Lý Giá", icon: CircleDollarSign },
    { id: "users", name: "Quản Lý User", icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "statistics":
        return <RevenueStatistics />;
      case "invoices":
        return <InvoiceHistory />;
      case "menu":
        return <MenuManagement />;
      case "tables":
        return <TableManagement />;
      case "prices":
        return <PriceManagement />;
      case "users":
        return <UserManagement />;
      default:
        return <RevenueStatistics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed h-screen z-30 lg:relative flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-coffee-600 dark:text-coffee-400" />
              <span className="font-bold text-gray-800 dark:text-gray-100">
                Admin Panel
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div
            className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}
          >
            <div className="w-10 h-10 rounded-full bg-coffee-600 flex items-center justify-center text-white font-bold">
              {currentUser.fullName[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${sidebarOpen ? "gap-3 justify-start" : "justify-center"} px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-coffee-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={!sidebarOpen ? tab.name : ""}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{tab.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-4 space-y-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center ${sidebarOpen ? "gap-3 justify-start" : "justify-center"} px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={!sidebarOpen ? "POS System" : ""}
          >
            <Coffee className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>POS System</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? "gap-3 justify-start" : "justify-center"} px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
            title={!sidebarOpen ? "Đăng Xuất" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Đăng Xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-auto ${!sidebarOpen ? "ml-20" : "ml-64"} lg:ml-0 transition-all duration-300`}
      >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
