import { Armchair } from "lucide-react";

const TableManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Armchair className="w-8 h-8" />
          Quản Lý Bàn
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Chức năng này sẽ được phát triển trong phiên bản tiếp theo
        </p>
      </div>
      <div className="card p-12 text-center">
        <Armchair className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Chức năng đang phát triển...
        </p>
      </div>
    </div>
  );
};

export default TableManagement;
