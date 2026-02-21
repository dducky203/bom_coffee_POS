import { useOrder } from "../context/OrderContext";
import { useNavigate } from "react-router-dom";
import TableCard from "../components/TableCard";
import { CircleDot, Clock, CreditCard, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const { tables } = useOrder();
  const navigate = useNavigate();

  const handleTableClick = (tableId) => {
    navigate("/", { state: { selectedTableId: tableId } });
  };

  const cafeTables = tables.filter((t) => t.type === "cafe");
  const billiardTables = tables.filter((t) => t.type === "billiard");

  const stats = {
    empty: tables.filter((t) => t.status === "empty").length,
    ordering: tables.filter((t) => t.status === "ordering").length,
    payment: tables.filter((t) => t.status === "payment").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Dashboard</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Quản lý đặt món theo bàn
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium">
                Bàn Trống
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1 sm:mt-2">
                {stats.empty}
              </p>
            </div>
            <CircleDot className="w-8 h-8 sm:w-12 sm:h-12 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-yellow-100 text-xs sm:text-sm font-medium">
                Đang Order
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1 sm:mt-2">
                {stats.ordering}
              </p>
            </div>
            <Clock className="w-8 h-8 sm:w-12 sm:h-12 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-100 text-xs sm:text-sm font-medium">
                Chờ Thanh Toán
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1 sm:mt-2">
                {stats.payment}
              </p>
            </div>
            <CreditCard className="w-8 h-8 sm:w-12 sm:h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="space-y-4 sm:space-y-6">
        {/* Bàn Cà Phê */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-6 bg-coffee-600 rounded"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              ☕ Bàn Cà Phê ({cafeTables.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {cafeTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table.id)}
              />
            ))}
          </div>
        </div>

        {/* Bàn Bi-a */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-6 bg-purple-600 rounded"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              🎱 Bàn Bi-a ({billiardTables.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {billiardTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
