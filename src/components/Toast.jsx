import { useOrder } from "../context/OrderContext";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const Toast = () => {
  const { toast } = useOrder();

  if (!toast.show) return null;

  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.type];

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`${bgColors[toast.type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}
      >
        <Icon className="w-6 h-6 shrink-0" />
        <span className="text-lg font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
