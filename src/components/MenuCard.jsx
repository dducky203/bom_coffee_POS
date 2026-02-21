import { useState } from "react";

const MenuCard = ({ item, onSelect }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onSelect(item)}
      className="card p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all animate-fade-in"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3">
        {!imageError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            ☕
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
        {item.name}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
        {item.description}
      </p>
      <p className="text-lg font-bold text-coffee-600 dark:text-coffee-400">
        {item.price.toLocaleString("vi-VN")}đ
      </p>
    </div>
  );
};

export default MenuCard;
