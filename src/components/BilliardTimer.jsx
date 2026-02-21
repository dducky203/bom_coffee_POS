import { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import {
  formatPlayTime,
  calculateBilliardCost,
  billiardPricing,
} from "../data/billiardData";
import { Play, Pause, Clock } from "lucide-react";

const BilliardTimer = ({ tableId }) => {
  const { getTable, startBilliard, stopBilliard } = useOrder();
  const table = getTable(tableId);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update thời gian mỗi giây
  useEffect(() => {
    if (table?.startTime && !table?.endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [table?.startTime, table?.endTime]);

  if (!table || table.type !== "billiard") return null;

  const isPlaying = table.startTime && !table.endTime;
  const playTime = formatPlayTime(table.startTime, table.endTime);
  const currentCost = calculateBilliardCost(
    table.startTime,
    table.endTime,
    table.billiardType,
  );
  const priceInfo = billiardPricing[table.billiardType];

  return (
    <div className="card p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${isPlaying ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            <Clock
              className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlaying ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
              {priceInfo.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {priceInfo.pricePerHour.toLocaleString("vi-VN")}đ/giờ
            </p>
          </div>
        </div>

        {/* Start/Stop Button */}
        {!table.startTime ? (
          <button
            onClick={() => startBilliard(tableId)}
            className="btn-primary px-4 py-2 text-sm sm:text-base flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Bắt Đầu</span>
          </button>
        ) : !table.endTime ? (
          <button
            onClick={() => stopBilliard(tableId)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Dừng</span>
          </button>
        ) : (
          <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs sm:text-sm font-semibold">
            Chờ thanh toán
          </div>
        )}
      </div>

      {/* Timer Display */}
      {table.startTime && (
        <div className="space-y-2 sm:space-y-3">
          {/* Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
              Thời gian chơi
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {playTime}
            </p>
          </div>

          {/* Cost */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
              Tiền giờ chơi
            </p>
            <p className="text-xl sm:text-2xl font-bold text-coffee-600 dark:text-coffee-400">
              {currentCost.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              (Làm tròn 0.5 giờ)
            </p>
          </div>
        </div>
      )}

      {/* Info khi chưa bắt đầu */}
      {!table.startTime && (
        <div className="text-center py-4 sm:py-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nhấn "Bắt Đầu" để bắt đầu tính giờ
          </p>
        </div>
      )}
    </div>
  );
};

export default BilliardTimer;
