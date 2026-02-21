import { useOrder } from "../context/OrderContext";
import { Moon, Sun } from "lucide-react";

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useOrder();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Moon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      ) : (
        <Sun className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      )}
    </button>
  );
};

export default DarkModeToggle;
