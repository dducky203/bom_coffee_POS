import { Coffee, Flame, Plus, Search, X } from 'lucide-react'
import { formatCurrency } from '../../../shared/lib/utils'

export function ProductList({
  categories,
  activeCategory,
  setActiveCategory,
  allProducts,
  searchQuery,
  setSearchQuery,
  filteredProducts,
  isDesktopCartVisible,
  setSelectedProduct,
}) {
  return (
    <>
      {/* Search & Category Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${!activeCategory || activeCategory === 'ALL'
                ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 scale-[1.02]'
                : 'bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-700 border border-brand-200/80 dark:border-brand-700'
              }`}
          >
            Tất cả ({allProducts.length})
          </button>
          {categories.map(cat => {
            const isActive = activeCategory === cat.id
            const count = allProducts.filter(p => (p.category?.id ?? p.categoryId) === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20 scale-[1.02]'
                    : 'bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-700 border border-brand-200/80 dark:border-brand-700'
                  }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Search Box Input */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            placeholder="Tìm tên món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-brand-200/80 dark:border-brand-700 bg-white dark:bg-brand-800 text-xs font-medium text-brand-900 dark:text-brand-50 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-brand-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 dark:hover:text-brand-200 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-brand-400 space-y-2">
            <Coffee size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">Không tìm thấy món nước nào phù hợp</p>
          </div>
        ) : (
          <div className={`grid gap-3.5 sm:gap-4 ${isDesktopCartVisible
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
            {filteredProducts.map(product => {
              const hasCustomOptions = product.hasDrinkOptions !== false
              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  title={product.name}
                  className="group cursor-pointer rounded-2xl border border-brand-200/70 dark:border-brand-700/80 bg-white dark:bg-brand-800 shadow-sm hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="h-36 sm:h-40 bg-gradient-to-br from-brand-100/60 to-brand-50 dark:from-brand-850 dark:to-brand-800 relative overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-brand-400 dark:text-brand-600 group-hover:scale-110 transition-transform duration-300">
                        <Coffee size={36} strokeWidth={1.5} />
                      </div>
                    )}

                    {/* HOT Tag */}
                    {hasCustomOptions && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider shadow-md shadow-orange-500/40 animate-pulse border border-amber-300/40 z-10">
                        <Flame size={12} className="fill-amber-200 text-amber-100 animate-bounce" />
                        HOT
                      </span>
                    )}

                    {/* Hover Overlay Icon */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Plus size={22} strokeWidth={3} />
                      </div>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-sm text-brand-900 dark:text-brand-50 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[11px] text-brand-500 dark:text-brand-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-brand-100 dark:border-brand-700/80">
                      <span className="text-sm font-black text-brand-900 dark:text-brand-50">
                        {formatCurrency(product.basePrice)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-700 text-brand-600 dark:text-brand-200 group-hover:bg-brand-600 group-hover:text-white dark:group-hover:bg-brand-600 flex items-center justify-center transition-all duration-200 shadow-sm">
                        <Plus size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
