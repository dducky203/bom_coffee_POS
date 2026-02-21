import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { FileText, Calendar, Search, Eye, Printer } from "lucide-react";

const InvoiceHistory = () => {
  const { adminData, getInvoicesByDate } = useAdmin();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const invoices = getInvoicesByDate(new Date(selectedDate));

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toString().includes(searchQuery),
  );

  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + inv.total,
    0,
  );

  const handlePrintInvoice = (invoice) => {
    const billContent = `
      ═══════════════════════════════════
      ☕ COFFEE & BILLIARD ORDER SYSTEM
      ═══════════════════════════════════
      Hóa đơn #${invoice.id}
      ${invoice.tableName}
      ${new Date(invoice.timestamp).toLocaleString("vi-VN")}
      Nhân viên: ${invoice.createdBy}
      ───────────────────────────────────
      
      ${invoice.items
        .map(
          (item, i) => `${i + 1}. ${item.name}
         x${item.quantity} - ${item.total.toLocaleString("vi-VN")}đ`,
        )
        .join("\n")}
      
      ───────────────────────────────────
      ${invoice.billiardCost > 0 ? `Tiền giờ bi-a: ${invoice.billiardCost.toLocaleString("vi-VN")}đ\n      ` : ""}Tổng cộng: ${invoice.total.toLocaleString("vi-VN")}đ
      ═══════════════════════════════════
      
      Cảm ơn quý khách!
    `;

    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa Đơn #${invoice.id}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${billContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Lịch Sử Hóa Đơn
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Xem chi tiết hóa đơn theo ngày
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chọn ngày:
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tìm kiếm:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo bàn hoặc ID..."
                className="input w-full pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm">Tổng hóa đơn</p>
          <p className="text-3xl font-bold mt-2">{filteredInvoices.length}</p>
        </div>
        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm">Tổng doanh thu</p>
          <p className="text-3xl font-bold mt-2">
            {totalRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm">Trung bình/HĐ</p>
          <p className="text-3xl font-bold mt-2">
            {filteredInvoices.length > 0
              ? Math.round(
                  totalRevenue / filteredInvoices.length,
                ).toLocaleString("vi-VN")
              : 0}
            đ
          </p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Danh sách hóa đơn ({filteredInvoices.length})
        </h3>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Không có hóa đơn nào trong ngày này
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thời gian
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Bàn
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tổng tiền
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nhân viên
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-sm">#{invoice.id}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(invoice.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {invoice.tableName}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-coffee-600 dark:text-coffee-400">
                      {invoice.total.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3 px-4 text-sm">{invoice.createdBy}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(invoice)}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="In hóa đơn"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Hóa Đơn #{selectedInvoice.id}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(selectedInvoice.timestamp).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bàn</p>
                <p className="font-semibold">{selectedInvoice.tableName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhân viên
                </p>
                <p className="font-semibold">{selectedInvoice.createdBy}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">
                Chi tiết đơn hàng:
              </h3>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <p className="font-semibold">
                      {item.total.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-coffee-600 dark:border-coffee-400 pt-4">
              {selectedInvoice.billiardCost > 0 && (
                <div className="flex justify-between text-lg mb-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    Tiền giờ bi-a:
                  </span>
                  <span className="font-semibold">
                    {selectedInvoice.billiardCost.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-coffee-600 dark:text-coffee-400">
                <span>Tổng cộng:</span>
                <span>{selectedInvoice.total.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                In Hóa Đơn
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-secondary px-6 py-3"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
