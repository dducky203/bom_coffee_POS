import { create } from 'zustand'
import { authApi, clearAuthStorage, setToken } from '../shared/lib/api'
import { extraPriceOf, optionsKey, selectedToppings } from '../shared/lib/drinkOptions'

const USER_KEY = 'bom_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = create((set) => ({
  user: readStoredUser(),
  login: async (username, password) => {
    const data = await authApi.login(username, password)
    const user = {
      id: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    }
    setToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
    return user
  },
  logout: () => {
    clearAuthStorage()
    set({ user: null })
  },
}))

export const useCartStore = create((set) => ({
  items: [],
  addItem: (product, quantity = 1, options = { ice: 100, sugar: 100, toppingIds: [], extraNote: '' }, allToppings = []) => set((state) => {
    const toppings = selectedToppings(allToppings, options.toppingIds || [])
    const extra = extraPriceOf(toppings)
    const unitPrice = Number(product.basePrice) + extra
    const key = `${product.id}-${optionsKey(options)}`
    const existing = state.items.find(i => i.key === key)
    if (existing) {
      return {
        items: state.items
          .map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i)
          .filter(i => i.quantity > 0)
      }
    }
    if (quantity <= 0) return state
    return {
      items: [...state.items, {
        id: `${product.id}-${Date.now()}`,
        key,
        product,
        quantity,
        options,
        toppings,
        unitPrice,
      }]
    }
  }),
  changeQty: (id, delta) => set((state) => ({
    items: state.items
      .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  clearCart: () => set({ items: [] }),
}))
