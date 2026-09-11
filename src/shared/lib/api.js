import axios from 'axios'
import toast from 'react-hot-toast'

const TOKEN_KEY = 'bom_token'
const USER_KEY = 'bom_user'

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

function parseJwtPayload(token) {
  try {
    const parts = String(token).split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/** Token còn hạn và đúng format JWT (không verify chữ ký phía FE). */
export function isTokenValid(token = getToken()) {
  if (!token || typeof token !== 'string') return false
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now()
}

export function clearAuthStorage() {
  setToken(null)
  localStorage.removeItem(USER_KEY)
}

/** Xóa session và đưa về login nếu đang ở trang khác. */
export function redirectToLogin() {
  clearAuthStorage()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/** Trả token hợp lệ; nếu hết hạn / sai format thì xóa storage và trả null. */
export function getValidToken() {
  const token = getToken()
  if (!token) return null
  if (!isTokenValid(token)) {
    clearAuthStorage()
    return null
  }
  return token
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bom-coffee-pos.onrender.com/api/v1',
})

api.interceptors.request.use((config) => {
  const isLogin = config.url?.includes('/auth/login')
  if (!isLogin) {
    const token = getToken()
    if (token && !isTokenValid(token)) {
      redirectToLogin()
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'))
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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

    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const isUnauthorized = err.status === 401
    const suppressToast = isUnauthorized && !isLoginRequest

    if (!error.config?.skipErrorToast && !suppressToast) {
      toast.error(message)
    }

    if (isUnauthorized && !isLoginRequest) {
      redirectToLogin()
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
  list: async (includeInactive = false) => {
    const data = await api.get('/toppings', { params: { includeInactive } })
    if (Array.isArray(data)) {
      return [...data].sort((a, b) => (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)) || (Number(a.id) - Number(b.id)))
    }
    return data
  },
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
  delete: (url) => api.delete('/uploads/image', { params: { url } }),
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
  updateStatuses: (itemIds, status) =>
    Promise.all(itemIds.map(id => api.patch(`/kds/items/${id}/status`, { status }))),
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
  stats: () => api.get('/users/stats'),
  get: (id) => api.get(`/users/${id}`),
  roles: () => api.get('/users/roles'),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  toggleActive: (id) => api.patch(`/users/${id}/active`),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/password`, { newPassword }),
}
