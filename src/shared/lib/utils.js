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

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
}

export function formatTimeOnly(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, 'HH:mm:ss')
}

export function durationSecondsBetween(start, end) {
  if (!start || !end) return 0
  const from = new Date(start).getTime()
  const to = new Date(end).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
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
