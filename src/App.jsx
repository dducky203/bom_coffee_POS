import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OrderPage from "./pages/OrderPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import DarkModeToggle from "./components/DarkModeToggle";
import Toast from "./components/Toast";
import { AdminProvider } from "./context/AdminContext";
import { Coffee, LayoutDashboard } from "lucide-react";

function App() {
  return (
    <AdminProvider>
      <Router>
        <div className="min-h-screen">
          <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
              <Link
                to="/"
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <Coffee className="w-8 sm:w-10 h-8 sm:h-10 text-coffee-600 dark:text-coffee-400" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-coffee-700 dark:text-coffee-400">
                    Bom Coffee
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    Professional Order System
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/dashboard"
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700 dark:text-gray-200" />
                </Link>
                <DarkModeToggle />
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<OrderPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>

          <Toast />
        </div>
      </Router>
    </AdminProvider>
  );
}

export default App;
