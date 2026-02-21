import { useOrder } from "../context/OrderContext";

const Toast = () => {
  const { toast } = useOrder();

  if (!toast.show) return null;

  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`${bgColors[toast.type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}
      >
        <span className="text-lg font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
