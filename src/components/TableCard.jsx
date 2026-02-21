import { Armchair, CircleDot, Clock, CreditCard } from "lucide-react";

const TableCard = ({ table, onClick }) => {
  const statusConfig = {
    empty: {
      color: "bg-green-100 dark:bg-green-900/30 border-green-500",
      textColor: "text-green-700 dark:text-green-400",
      icon: CircleDot,
      label: "Trống",
    },
    ordering: {
      color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500",
      textColor: "text-yellow-700 dark:text-yellow-400",
      icon: Clock,
      label: "Đang Order",
    },
    payment: {
      color: "bg-red-100 dark:bg-red-900/30 border-red-500",
      textColor: "text-red-700 dark:text-red-400",
      icon: CreditCard,
      label: "Chờ Thanh Toán",
    },
  };

  const config = statusConfig[table.status];
  const StatusIcon = config.icon;
  const itemCount = table.orders.length;

  return (
    <div
      onClick={onClick}
      className={`card ${config.color} border-2 p-3 sm:p-6 cursor-pointer hover:scale-105 transition-transform animate-fade-in hover:shadow-xl`}
    >
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        <Armchair className="w-8 h-8 sm:w-12 sm:h-12 text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {table.name}
        </h3>
        <div
          className={`flex items-center gap-1.5 sm:gap-2 ${config.textColor} font-semibold text-xs sm:text-base`}
        >
          <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{config.label}</span>
        </div>
        {itemCount > 0 && (
          <div className="bg-coffee-600 text-white px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
            {itemCount} món
          </div>
        )}
      </div>
    </div>
  );
};

export default TableCard;
