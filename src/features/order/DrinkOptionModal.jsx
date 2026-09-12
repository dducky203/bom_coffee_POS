import React, { useMemo, useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Button } from '../../shared/components/Button'
import { formatCurrency } from '../../shared/lib/utils'
import { PERCENT_OPTIONS, defaultDrinkOptions, extraPriceOf, selectedToppings } from '../../shared/lib/drinkOptions'
import { Snowflake, Sparkles, Check, ShoppingBag, FileText, Coffee } from 'lucide-react'

function ChipGroup({ label, icon: Icon, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
        {Icon && <Icon size={14} className="text-brand-500" />}
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {PERCENT_OPTIONS.map(percent => {
          const isActive = value === percent
          return (
            <button
              key={percent}
              type="button"
              onClick={() => onChange(percent)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border text-center flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white border-brand-600 shadow-md shadow-brand-600/20 scale-[1.03] ring-2 ring-brand-400/40'
                  : 'bg-brand-50/60 dark:bg-brand-800/40 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-700/60 hover:bg-brand-100/80 hover:border-brand-300 dark:hover:bg-brand-800'
              }`}
            >
              <span>{percent}%</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DrinkOptionModal({ product, toppings, onClose, onAdd }) {
  const hasDrinkOptions = product.hasDrinkOptions !== false
  const isOtherCategory = String(product.category?.name || '').trim().toLowerCase() === 'khác'
  const [options, setOptions] = useState(() => {
    const base = defaultDrinkOptions(toppings)
    // Danh mục "Khác" không chọn topping
    if (String(product.category?.name || '').trim().toLowerCase() === 'khác') {
      return { ...base, toppingIds: [] }
    }
    return base
  })

  const chosenToppings = useMemo(
    () => (isOtherCategory ? [] : selectedToppings(toppings, options.toppingIds)),
    [toppings, options.toppingIds, isOtherCategory]
  )
  const extra = isOtherCategory ? 0 : extraPriceOf(chosenToppings)
  const unitPrice = Number(product.basePrice) + extra

  const toggleTopping = (id) => {
    setOptions((prev) => ({
      ...prev,
      toppingIds: prev.toppingIds.includes(id)
        ? prev.toppingIds.filter(x => x !== id)
        : [...prev.toppingIds, id],
    }))
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Chi tiết đơn món"
      subtitle={product.name}
      className="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block">TỔNG ĐƠN MÓN</span>
            <span className="text-xl font-black text-brand-900 dark:text-brand-50">
              {formatCurrency(unitPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl px-4 h-11 border-brand-200 text-brand-700 hover:bg-brand-100/60 dark:border-brand-700 dark:text-brand-300 font-medium"
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={() => onAdd(isOtherCategory ? { ...options, toppingIds: [] } : options)}
              className="rounded-xl px-5 h-11 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              <span>Thêm vào giỏ</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Product Banner Info */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 dark:from-brand-800/50 dark:to-brand-800/20 border border-brand-200/60 dark:border-brand-700/50 shadow-sm">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-16 h-16 rounded-xl object-cover border border-white/50 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-200/60 dark:bg-brand-700/60 flex items-center justify-center text-brand-700 dark:text-brand-200 shrink-0">
              <Coffee size={28} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-brand-900 dark:text-brand-50 truncate">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-brand-500 dark:text-brand-400 line-clamp-1 mt-0.5">{product.description}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-medium text-brand-500">Giá gốc:</span>
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-white/80 dark:bg-brand-900/80 px-2 py-0.5 rounded-md border border-brand-200/50">
                {formatCurrency(product.basePrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Ice & Sugar Percentage Options */}
        {hasDrinkOptions && (
          <div className="space-y-4 p-4 rounded-2xl bg-white dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 shadow-sm">
            <ChipGroup label="Mức đá" icon={Snowflake} value={options.ice} onChange={(ice) => setOptions({ ...options, ice })} />
            <div className="border-t border-brand-100/80 dark:border-brand-800/80 pt-3">
              <ChipGroup label="Mức đường" icon={Sparkles} value={options.sugar} onChange={(sugar) => setOptions({ ...options, sugar })} />
            </div>
          </div>
        )}

        {/* Toppings — ẩn với danh mục "Khác" */}
        {!isOtherCategory && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Chọn Topping ({chosenToppings.length})
              </label>
              {extra > 0 && (
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  + {formatCurrency(extra)}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
              {toppings.map(topping => {
                const checked = options.toppingIds.includes(topping.id)
                const price = Number(topping.extraPrice || 0)
                return (
                  <div
                    key={topping.id}
                    onClick={() => toggleTopping(topping.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer select-none transition-all duration-200 ${
                      checked 
                        ? 'border-brand-500/80 bg-brand-500/10 dark:bg-brand-500/20 text-brand-900 dark:text-brand-50 shadow-sm ring-1 ring-brand-500/40 font-semibold' 
                        : 'border-brand-200/80 dark:border-brand-700/60 bg-white dark:bg-brand-800/40 hover:bg-brand-50 dark:hover:bg-brand-800 text-brand-700 dark:text-brand-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        checked ? 'bg-brand-600 border-brand-600 text-white' : 'border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-900'
                      }`}>
                        {checked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{topping.name}</span>
                      {topping.defaultTopping && (
                        <span className="shrink-0 text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand-200/60 dark:bg-brand-700 text-brand-700 dark:text-brand-300 font-bold">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 font-bold ${checked ? 'text-brand-700 dark:text-brand-200' : 'text-brand-500'}`}>
                      {price > 0 ? `+${formatCurrency(price)}` : 'Miễn phí'}
                    </span>
                  </div>
                )
              })}
              {toppings.length === 0 && (
                <p className="text-xs text-brand-400 text-center py-4 col-span-2">Chưa có topping nào</p>
              )}
            </div>
          </div>
        )}

        {/* Extra Note Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            <FileText size={14} className="text-brand-500" />
            <span>Ghi chú thêm</span>
          </label>
          <input
            className="w-full h-11 px-3.5 rounded-xl border border-brand-200/80 dark:border-brand-700/80 bg-brand-50/30 dark:bg-brand-900/50 text-sm text-brand-900 dark:text-brand-50 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-brand-400"
            placeholder="Ví dụ: Ít ngọt, ít đá, mang về..."
            value={options.extraNote}
            onChange={(e) => setOptions({ ...options, extraNote: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}

