import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, FileText, Calendar } from "lucide-react";

const RevenueStatistics = () => {
  const { getDailyRevenue, getMonthlyRevenue, adminData } = useAdmin();
  const [viewMode, setViewMode] = useState("daily"); // daily | monthly
  const [days, setDays] = useState(7);
  const [months, setMonths] = useState(6);

  const dailyData = getDailyRevenue(days);
  const monthlyData = getMonthlyRevenue(months);
  const currentData = viewMode === "daily" ? dailyData : monthlyData;

  // Calculate totals
  const totalRevenue = currentData.reduce((sum, item) => sum + item.total, 0);
  const totalInvoices = currentData.reduce((sum, item) => sum + item.count, 0);
  const averageRevenue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Today's stats
  const today = dailyData[dailyData.length - 1] || { total: 0, count: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Thống Kê Doanh Thu
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Theo dõi doanh thu và hiệu suất kinh doanh
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "daily"
                ? "bg-coffee-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Theo Ngày
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "monthly"
                ? "bg-coffee-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Theo Tháng
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tổng Doanh Thu</p>
              <p className="text-3xl font-bold mt-2">
                {totalRevenue.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Total Invoices */}
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng Hóa Đơn</p>
              <p className="text-3xl font-bold mt-2">{totalInvoices}</p>
            </div>
            <FileText className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Average per Invoice */}
        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Trung Bình/HĐ</p>
              <p className="text-3xl font-bold mt-2">
                {averageRevenue.toLocaleString("vi-VN", {
                  maximumFractionDigits: 0,
                })}
                đ
              </p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Hôm Nay</p>
              <p className="text-3xl font-bold mt-2">
                {today.total.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-orange-100 text-xs mt-1">
                {today.count} hóa đơn
              </p>
            </div>
            <Calendar className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      {viewMode === "daily" && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số ngày hiển thị:
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input w-full sm:w-auto"
          >
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
            <option value={30}>30 ngày</option>
          </select>
        </div>
      )}

      {viewMode === "monthly" && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tháng hiển thị:
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="input w-full sm:w-auto"
          >
            <option value={6}>6 tháng</option>
            <option value={12}>12 tháng</option>
          </select>
        </div>
      )}

      {/* Bar Chart - Revenue */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Biểu Đồ Doanh Thu
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={viewMode === "daily" ? "date" : "month"}
              tick={{ fill: "#6B7280" }}
            />
            <YAxis
              tick={{ fill: "#6B7280" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => `${value.toLocaleString("vi-VN")}đ`}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
              }}
            />
            <Legend />
            <Bar dataKey="total" fill="#8B4513" name="Doanh thu" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart - Invoice Count */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Số Lượng Hóa Đơn
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={viewMode === "daily" ? "date" : "month"}
              tick={{ fill: "#6B7280" }}
            />
            <YAxis tick={{ fill: "#6B7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10B981"
              strokeWidth={2}
              name="Số hóa đơn"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueStatistics;
