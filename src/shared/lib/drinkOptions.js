export const PERCENT_OPTIONS = [0, 30, 50, 70, 100]

export function defaultDrinkOptions(toppings = []) {
  return {
    ice: 100,
    sugar: 100,
    toppingIds: toppings.filter(t => t.defaultTopping).map(t => t.id),
    extraNote: '',
  }
}

export function selectedToppings(allToppings, toppingIds) {
  return allToppings.filter(t => toppingIds.includes(t.id))
}

export function extraPriceOf(toppings) {
  return toppings.reduce((sum, t) => sum + Number(t.extraPrice || 0), 0)
}

export function buildDrinkNote({ hasDrinkOptions, ice, sugar, toppings, extraNote }) {
  const parts = []
  if (hasDrinkOptions) {
    parts.push(`Đá ${ice}%`)
    parts.push(`Đường ${sugar}%`)
  }
  if (toppings.length) {
    parts.push(`Topping: ${toppings.map(t => t.name).join(', ')}`)
  }
  if (extraNote?.trim()) {
    parts.push(extraNote.trim())
  }
  return parts.join(' | ')
}

export function optionsKey(options) {
  const ids = [...(options.toppingIds || [])].sort().join(',')
  return `${options.ice ?? ''}-${options.sugar ?? ''}-${ids}-${options.extraNote || ''}`
}
