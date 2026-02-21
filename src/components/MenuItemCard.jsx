import { useState } from "react";
import { Plus } from "lucide-react";

const MenuItemCard = ({ item, onSelect }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onSelect(item)}
      className="card p-2.5 sm:p-3 cursor-pointer hover:shadow-xl active:scale-98 transition-all animate-fade-in flex gap-2.5 sm:gap-3"
    >
      {/* Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {!imageError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">
            ☕
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1 text-sm sm:text-base">
            {item.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base sm:text-lg font-bold text-coffee-600 dark:text-coffee-400">
            {item.price.toLocaleString("vi-VN")}đ
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-coffee-600 hover:bg-coffee-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
