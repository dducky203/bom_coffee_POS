import axios from 'axios'
import toast from 'react-hot-toast'

const TOKEN_KEY = 'bom_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bom-coffee-pos.onrender.com/api/v1',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body.success === 'boolean') {
      if (!body.success) {
        const err = new Error(body.message || 'Request failed')
        err.code = body.errorCode
        err.status = res.status
        toast.error(err.message)
        throw err
      }

      // Auto show success toast for non-GET requests if backend provides a message
      if (res.config.method !== 'get' && body.message) {
        toast.success(body.message)
      }

      return body.data
    }
    return body
  },
  (error) => {
    const body = error.response?.data
    const message = body?.message
      || (error.code === 'ERR_NETWORK' || !error.response
        ? 'Không kết nối được máy chủ. Hãy chạy backend ở cổng 8080.'
        : error.message)
      || 'Lỗi kết nối máy chủ'
    const err = new Error(message)
    err.code = body?.errorCode
    err.status = error.response?.status

    // Only show error toast if it's not a 401 redirecting to login (to avoid double noise)
    if (err.status !== 401 || window.location.pathname !== '/login') {
      toast.error(message)
    }

    if (err.status === 401 && !error.config?.url?.includes('/auth/login')) {
      setToken(null)
      localStorage.removeItem('bom_user')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    throw err
  }
)

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
}

export const tableApi = {
  list: () => api.get('/tables'),
  get: (id) => api.get(`/tables/${id}`),
}

export const categoryApi = {
  list: (includeInactive = false) => api.get('/categories', { params: { includeInactive } }),
  create: (payload) => api.post('/categories', payload),
  update: (id, payload) => api.put(`/categories/${id}`, payload),
  remove: (id) => api.delete(`/categories/${id}`),
}

export const toppingApi = {
  list: (includeInactive = false) => api.get('/toppings', { params: { includeInactive } }),
  create: (payload) => api.post('/toppings', payload),
  update: (id, payload) => api.put(`/toppings/${id}`, payload),
  remove: (id) => api.delete(`/toppings/${id}`),
}

export const uploadApi = {
  image: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/uploads/image', form)
  },
}

export const productApi = {
  list: (categoryId, includeInactive = false) =>
    api.get('/products', { params: { ...(categoryId ? { categoryId } : {}), includeInactive } }),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
}

export const orderApi = {
  listOpen: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  getByTable: (tableId) => api.get(`/orders/table/${tableId}`),
  create: (tableId) => api.post('/orders', { tableId }),
  submit: (payload) => api.post('/orders/submit', payload),
  addItem: (orderId, payload) => api.post(`/orders/${orderId}/items`, payload),
  removeItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),
  checkout: (orderId, payload) => api.post(`/orders/${orderId}/checkout`, payload),
}

export const kdsApi = {
  queue: (all = false) => api.get('/kds/queue', { params: all ? { all: true } : {} }),
  updateStatus: (itemId, status) => api.patch(`/kds/items/${itemId}/status`, { status }),
}

export const billiardApi = {
  current: (tableId) => api.get(`/billiard/${tableId}/current`),
  start: (tableId) => api.post(`/billiard/${tableId}/start`),
  stop: (tableId, sessionId) => api.post(`/billiard/${tableId}/stop`, sessionId ? { sessionId } : {}),
}

export const billiardPricingApi = {
  list: () => api.get('/billiard-pricing'),
  create: (payload) => api.post('/billiard-pricing', payload),
  update: (id, payload) => api.put(`/billiard-pricing/${id}`, payload),
  remove: (id) => api.delete(`/billiard-pricing/${id}`),
}

export const reportApi = {
  revenue: (from, to) => api.get('/reports/revenue', { params: { from, to } }),
  topProducts: (from, to) => api.get('/reports/top-products', { params: { from, to } }),
  revenueByStaff: (from, to) => api.get('/reports/revenue-by-staff', { params: { from, to } }),
}

export const historyApi = {
  getOrders: (params) => api.get('/history/orders', { params }),
  getOrderDetail: (id) => api.get(`/history/orders/${id}`),
  staffs: () => api.get('/history/staffs'),
}

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  roles: () => api.get('/users/roles'),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  toggleActive: (id) => api.patch(`/users/${id}/active`),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/password`, { newPassword }),
}
