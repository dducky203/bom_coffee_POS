import { useOrder } from "../context/OrderContext";
import { Armchair, CircleDot, Clock, CreditCard } from "lucide-react";

const TableSelector = ({ selectedTableId, onSelectTable }) => {
  const { tables } = useOrder();

  const getStatusIcon = (status) => {
    switch (status) {
      case "empty":
        return <CircleDot className="w-4 h-4 text-green-500" />;
      case "ordering":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "empty":
        return "border-green-500 bg-green-50 dark:bg-green-900/20";
      case "ordering":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "payment":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      default:
        return "border-gray-300";
    }
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Armchair className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
          Chọn Bàn
        </h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            className={`cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[100px] sm:min-w-auto ${
              selectedTableId === table.id
                ? "border-coffee-600 bg-coffee-600 text-white shadow-lg scale-105"
                : `${getStatusColor(table.status)} hover:scale-105`
            }`}
          >
            {getStatusIcon(table.status)}
            <span className="font-medium text-sm sm:text-base">
              {table.name}
            </span>
            {table.orders.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {table.orders.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableSelector;
