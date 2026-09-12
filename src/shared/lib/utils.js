import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Merge tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in VND
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format duration (seconds -> HH:mm:ss)
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parse datetime từ backend.
 * LocalDateTime Jackson thường trả "2026-09-11T22:12:44" (không có Z) = giờ tường của máy chủ/quán.
 * Không được gắn 'Z' (UTC) vì sẽ lệch +7h và làm đồng hồ bi-a đứng ở 00:00:00.
 */
export function parseServerDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(' ', 'T')
    // Đã có timezone (Z hoặc +07:00) → parse chuẩn
    if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
      const withTz = new Date(trimmed)
      return Number.isNaN(withTz.getTime()) ? null : withTz
    }
    // Không timezone: coi là giờ địa phương (VN). Chrome: new Date('YYYY-MM-DDTHH:mm:ss') = local
    const local = new Date(trimmed)
    if (!Number.isNaN(local.getTime())) return local
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Số giây đã chơi, ưu tiên startTime local; fallback elapsedSeconds từ API. */
export function liveElapsedSeconds(startTime, now = new Date(), fallbackElapsed = 0) {
  const start = parseServerDate(startTime)
  if (start) {
    const elapsed = Math.floor((parseServerDate(now)?.getTime() - start.getTime()) / 1000)
    if (Number.isFinite(elapsed) && elapsed >= 0) return elapsed
  }
  return Math.max(0, Number(fallbackElapsed) || 0)
}

export function formatDateTime(value) {
  const date = parseServerDate(value)
  if (!date) return '—'
  return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
}

export function formatTimeOnly(value) {
  const date = parseServerDate(value)
  if (!date) return '—'
  return format(date, 'HH:mm:ss')
}

export function durationSecondsBetween(start, end) {
  if (!start || !end) return 0
  const from = parseServerDate(start)?.getTime()
  const to = parseServerDate(end)?.getTime()
  if (!from || !to) return 0
  return Math.max(0, Math.floor((to - from) / 1000))
}

export function formatPlayDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m} phút`
  return `${s} giây`
}

export function drinkCountOf(order) {
  return (order?.items || [])
    .filter(item => item.status !== 'CANCELLED')
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

export function drinkAmountOf(order) {
  return (order?.items || [])
    .filter(item => item.status !== 'CANCELLED')
    .reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
}

/**
 * Gộp các dòng order trùng (cùng món + ghi chú + trạng thái + đơn giá) để hiển thị.
 * Trả về: { key, quantity, unitPrice, note, status, product, ids, items }
 */
export function mergeOrderItems(items = []) {
  const map = new Map()
  for (const item of items) {
    if (!item) continue
    const productId = item.product?.id ?? item.productId ?? ''
    const name = item.product?.name || item.productName || ''
    const note = (item.note || '').trim()
    const status = item.status || ''
    const unitPrice = Number(item.unitPrice || 0)
    const key = `${productId}|${name}|${note}|${status}|${unitPrice}`
    const qty = Number(item.quantity || 0)
    if (map.has(key)) {
      const cur = map.get(key)
      cur.quantity += qty
      cur.ids.push(item.id)
      cur.items.push(item)
    } else {
      map.set(key, {
        key,
        id: item.id,
        ids: item.id != null ? [item.id] : [],
        items: [item],
        quantity: qty,
        unitPrice,
        note: item.note || '',
        status,
        product: item.product || { id: productId, name, category: item.product?.category },
      })
    }
  }
  return Array.from(map.values())
}

/** Chỉ món thuộc danh mục có tên chính xác "Khác" không gửi KDS. */
export function isKitchenItem(item) {
  const cat = item?.product?.category
  if (!cat) return true
  const name = String(cat.name || '').trim().toLowerCase()
  return name !== 'khác'
}

export function finishedBilliardSessions(order) {
  return (order?.billiardSessions || []).filter(session => session.status === 'FINISHED' || session.endTime)
}

export function orderContentSummary(order, now = new Date()) {
  const drinks = drinkCountOf(order)
  const sessions = finishedBilliardSessions(order)
  const play = sessions.reduce((acc, session) => {
    acc.seconds += durationSecondsBetween(session.startTime, session.endTime)
    acc.amount += Number(session.totalAmount || 0)
    return acc
  }, { seconds: 0, amount: 0 })

  if (play.seconds === 0 && play.amount === 0 && drinks === 0) {
    return 'Không có món'
  }

  const parts = []
  if (play.seconds > 0 || play.amount > 0) {
    parts.push(`${formatPlayDuration(play.seconds)} chơi ${formatCurrency(play.amount)}`)
  }
  if (drinks > 0) {
    parts.push(`${drinks} nước`)
  }
  const tableName = order?.table?.name
  const host = order?.customerName?.trim()
  const body = parts.join(', ')
  const titled = tableName ? `${tableName}: ${body}` : body
  return host ? `${titled} · ${host}` : titled
}

export function billiardTimeRangeLabel(sessions) {
  const finished = (sessions || []).filter(session => session.startTime)
  if (finished.length === 0) return ''
  const starts = finished.map(session => new Date(session.startTime).getTime()).filter(n => !Number.isNaN(n))
  const ends = finished
    .map(session => session.endTime ? new Date(session.endTime).getTime() : null)
    .filter(n => n != null && !Number.isNaN(n))
  if (starts.length === 0) return ''
  const start = formatTimeOnly(new Date(Math.min(...starts)))
  const end = ends.length ? formatTimeOnly(new Date(Math.max(...ends))) : 'đang chơi'
  return `${start} → ${end}`
}
