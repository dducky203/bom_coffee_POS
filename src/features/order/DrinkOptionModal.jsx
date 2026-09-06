import React, { useMemo, useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Button } from '../../shared/components/Button'
import { formatCurrency } from '../../shared/lib/utils'
import { PERCENT_OPTIONS, defaultDrinkOptions, extraPriceOf, selectedToppings } from '../../shared/lib/drinkOptions'

function ChipGroup({ label, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-800 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {PERCENT_OPTIONS.map(percent => (
          <button
            key={percent}
            type="button"
            onClick={() => onChange(percent)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              value === percent
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
            }`}
          >
            {percent}%
          </button>
        ))}
      </div>
    </div>
  )
}

export function DrinkOptionModal({ product, toppings, onClose, onAdd }) {
  const hasDrinkOptions = product.hasDrinkOptions !== false
  const [options, setOptions] = useState(() => defaultDrinkOptions(toppings))

  const chosenToppings = useMemo(
    () => selectedToppings(toppings, options.toppingIds),
    [toppings, options.toppingIds]
  )
  const extra = extraPriceOf(chosenToppings)
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
    <Modal isOpen onClose={onClose} title={product.name} className="max-w-xl">
      <div className="space-y-4">
        <p className="text-brand-600 font-bold">{formatCurrency(product.basePrice)} <span className="text-sm font-normal text-brand-400">giá gốc</span></p>

        {hasDrinkOptions && (
          <>
            <ChipGroup label="Đá" value={options.ice} onChange={(ice) => setOptions({ ...options, ice })} />
            <ChipGroup label="Đường" value={options.sugar} onChange={(sugar) => setOptions({ ...options, sugar })} />
          </>
        )}

        <div>
          <p className="text-sm font-semibold text-brand-800 mb-2">Topping</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {toppings.map(topping => {
              const checked = options.toppingIds.includes(topping.id)
              const price = Number(topping.extraPrice || 0)
              return (
                <label key={topping.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${checked ? 'border-brand-500 bg-brand-50' : 'border-brand-200 bg-white'}`}>
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={() => toggleTopping(topping.id)} />
                    {topping.name}
                    {topping.defaultTopping && <span className="text-[10px] uppercase text-brand-500">mặc định</span>}
                  </span>
                  <span className="font-medium text-brand-700">{price > 0 ? `+${formatCurrency(price)}` : 'Free'}</span>
                </label>
              )
            })}
            {toppings.length === 0 && <p className="text-sm text-brand-400">Chưa có topping</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-brand-800">Ghi chú thêm</label>
          <input
            className="mt-1 w-full h-10 px-3 rounded-lg border border-brand-200 text-sm outline-none focus:border-brand-500"
            placeholder="Ít ngọt, mang về..."
            value={options.extraNote}
            onChange={(e) => setOptions({ ...options, extraNote: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="font-bold text-lg">{formatCurrency(unitPrice)}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="button" onClick={() => onAdd(options)}>Thêm vào giỏ</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
