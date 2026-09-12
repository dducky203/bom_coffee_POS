import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/Card'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardStats } from './components/DashboardStats'
import { RevenueChart } from './components/RevenueChart'
import { PaymentMethodsChart } from './components/PaymentMethodsChart'
import { TopProductsTable } from './components/TopProductsTable'
import { formatCurrency } from '../../shared/lib/utils'
import { reportApi, historyApi } from '../../shared/lib/api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts'
import { 
  TrendingUp, Users, ShoppingBag, Coffee, Calendar, RefreshCw, 
  CreditCard, Receipt, DollarSign, Award, Trophy, Flame, Sparkles, 
  ArrowUpRight, CircleDot, ChevronRight, CheckCircle2
} from 'lucide-react'

const COLOR_PALETTE = [
  '#a37b67', '#ea580c', '#0f766e', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
]

const METHOD_CONFIG = {
  CASH: { 
    label: 'Tiền mặt', 
    color: '#10b981', 
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
  },
  QR: { 
    label: 'Chuyển khoản QR', 
    color: '#0ea5e9', 
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' 
  },
  BANK_TRANSFER: { 
    label: 'Chuyển khoản NH', 
    color: '#6366f1', 
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
  },
  CARD: { 
    label: 'Thẻ ATM / POS', 
    color: '#8b5cf6', 
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
  },
  EWALLET: { 
    label: 'Ví điện tử', 
    color: '#ec4899', 
    badge: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800' 
  },
}

export function DashboardPage() {
  // Date Presets state
  const [preset, setPreset] = useState('LAST_7_DAYS')
  const [customFrom, setCustomFrom] = useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Calculate actual date range based on preset selection
  const { from, to } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    switch (preset) {
      case 'TODAY':
        return { from: todayStr, to: todayStr }
      case 'LAST_7_DAYS':
        return { from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: todayStr }
      case 'LAST_30_DAYS':
        return { from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: todayStr }
      case 'THIS_MONTH':
        return { from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: todayStr }
      case 'CUSTOM':
      default:
        return { from: customFrom, to: customTo }
    }
  }, [preset, customFrom, customTo])

  // Queries
  const { data: revenue, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn: () => reportApi.revenue(from, to),
  })

  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['report-top-products', from, to],
    queryFn: () => reportApi.topProducts(from, to),
  })

  const { data: staffRevenue = [], isLoading: staffLoading } = useQuery({
    queryKey: ['report-staff', from, to],
    queryFn: () => reportApi.revenueByStaff(from, to),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['report-history-orders', from, to],
    queryFn: () => historyApi.getOrders({ from, to, size: 500, status: 'COMPLETED' }),
  })

  const { data: paymentMethods = [], isLoading: paymentLoading } = useQuery({
    queryKey: ['report-payment-methods', from, to],
    queryFn: () => reportApi.revenueByPaymentMethod(from, to),
  })

  const { data: tableTypeRevenue = [], isLoading: tableTypeLoading } = useQuery({
    queryKey: ['report-table-type', from, to],
    queryFn: () => reportApi.revenueByTableType(from, to),
  })

  const { data: serviceRevenue = [], isLoading: serviceLoading } = useQuery({
    queryKey: ['report-service', from, to],
    queryFn: () => reportApi.revenueByService(from, to),
  })

  const orders = historyData?.content || []
  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID')
  }, [orders])

  // 1. Chart Data: Timeline Area Chart
  // - TODAY preset: group by HOUR (06:00 → 01:00 next day)
  // - Other presets: group by DAY
  const isHourly = preset === 'TODAY'

  const timelineChartData = useMemo(() => {
    if (!completedOrders.length) {
      // For TODAY, still show the full hourly skeleton with 0 values
      if (isHourly) {
        const slots = []
        // 06 → 23
        for (let h = 6; h <= 23; h++) {
          slots.push({ date: `${String(h).padStart(2, '0')}:00`, revenue: 0, orders: 0, sortKey: h })
        }
        // 00 → 01 (next day, treat as 24, 25 for sort)
        for (let h = 0; h <= 1; h++) {
          slots.push({ date: `${String(h).padStart(2, '0')}:00`, revenue: 0, orders: 0, sortKey: h + 24 })
        }
        return slots
      }
      return []
    }

    if (isHourly) {
      // Build skeleton: 06:00 to 01:00 next day
      const slotMap = new Map()
      for (let h = 6; h <= 23; h++) {
        const key = String(h).padStart(2, '0') + ':00'
        slotMap.set(key, { date: key, revenue: 0, orders: 0, sortKey: h })
      }
      for (let h = 0; h <= 1; h++) {
        const key = String(h).padStart(2, '0') + ':00'
        slotMap.set(key, { date: key, revenue: 0, orders: 0, sortKey: h + 24 })
      }

      completedOrders.forEach(o => {
        const dateKey = o.closedAt || o.createdAt
        if (!dateKey) return
        const parsed = parseISO(dateKey)
        const hour = parsed.getHours()
        // Map hour 0 and 1 to next-day slots, hours 2-5 ignored (outside range)
        let slotKey
        if (hour >= 6 && hour <= 23) {
          slotKey = String(hour).padStart(2, '0') + ':00'
        } else if (hour === 0 || hour === 1) {
          slotKey = String(hour).padStart(2, '0') + ':00'
        } else {
          return // 02:00–05:59 excluded
        }
        const amt = Number(o.finalAmount || o.totalAmount || 0)
        if (slotMap.has(slotKey)) {
          const slot = slotMap.get(slotKey)
          slot.revenue += amt
          slot.orders += 1
        }
      })

      return Array.from(slotMap.values()).sort((a, b) => a.sortKey - b.sortKey)
    }

    // Daily grouping for multi-day presets
    const map = new Map()
    completedOrders.forEach(o => {
      const dateKey = o.closedAt || o.createdAt
      if (!dateKey) return
      const parsed = parseISO(dateKey)
      const isoDay = format(parsed, 'yyyy-MM-dd')
      const displayDate = format(parsed, 'dd/MM')
      const amt = Number(o.finalAmount || o.totalAmount || 0)

      if (map.has(isoDay)) {
        const cur = map.get(isoDay)
        cur.revenue += amt
        cur.orders += 1
      } else {
        map.set(isoDay, {
          isoDay,
          date: displayDate,
          revenue: amt,
          orders: 1,
        })
      }
    })

    const list = Array.from(map.values())
    list.sort((a, b) => a.isoDay.localeCompare(b.isoDay))
    return list.map(item => ({
      ...item,
      avgOrder: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0,
    }))
  }, [completedOrders, isHourly])

  // Timeline Highlights
  const timelineStats = useMemo(() => {
    const nonZero = timelineChartData.filter(d => d.revenue > 0)
    if (!nonZero.length) return { peak: null, avgDaily: 0, activeDays: 0 }
    let peak = nonZero[0]
    let total = 0
    nonZero.forEach(d => {
      total += d.revenue
      if (d.revenue > peak.revenue) peak = d
    })
    return {
      peak,
      avgDaily: Math.round(total / nonZero.length),
      activeDays: nonZero.length,
    }
  }, [timelineChartData])

  // 2. Service Breakdown: Đồ uống vs Giờ Bi-a (Robust fallback)
  const serviceStats = useMemo(() => {
    let drinkRev = 0
    let billiardRev = 0

    // Priority 1: Backend serviceRevenue API
    if (serviceRevenue && serviceRevenue.length > 0) {
      serviceRevenue.forEach(row => {
        if (row.key === 'BILLIARD_TIME' || row.key === 'BILLIARD') {
          billiardRev += Number(row.revenue || 0)
        } else {
          drinkRev += Number(row.revenue || 0)
        }
      })
    }

    // Priority 2: Backend tableTypeRevenue API if serviceRevenue had 0
    if (drinkRev === 0 && billiardRev === 0 && tableTypeRevenue && tableTypeRevenue.length > 0) {
      tableTypeRevenue.forEach(row => {
        if (row.key === 'BILLIARD') {
          billiardRev += Number(row.revenue || 0)
        } else {
          drinkRev += Number(row.revenue || 0)
        }
      })
    }

    // Priority 3: Frontend Fallback from completedOrders
    if (drinkRev === 0 && billiardRev === 0 && completedOrders.length > 0) {
      completedOrders.forEach(o => {
        let orderBilliard = 0
        if (o.billiardSessions && o.billiardSessions.length > 0) {
          o.billiardSessions.forEach(s => {
            orderBilliard += Number(s.totalAmount || 0)
          })
        }
        if (orderBilliard === 0 && o.table?.type === 'BILLIARD') {
          const itemTotal = (o.items || []).reduce((sum, it) => sum + Number(it.subtotal || (it.unitPrice * it.quantity) || 0), 0)
          const orderTotal = Number(o.finalAmount || o.totalAmount || 0)
          if (itemTotal > 0 && orderTotal > itemTotal) {
            orderBilliard = orderTotal - itemTotal
          } else if (itemTotal === 0) {
            orderBilliard = orderTotal
          }
        }
        const orderTotal = Number(o.finalAmount || o.totalAmount || 0)
        const orderDrink = Math.max(0, orderTotal - orderBilliard)
        drinkRev += orderDrink
        billiardRev += orderBilliard
      })
    }

    const total = drinkRev + billiardRev
    const drinkPct = total > 0 ? Math.round((drinkRev / total) * 1000) / 10 : 0
    const billiardPct = total > 0 ? Math.round((billiardRev / total) * 1000) / 10 : 0

    const chartData = [
      { name: 'Đồ uống & Topping', value: drinkRev, color: '#a37b67', pct: drinkPct },
      { name: 'Giờ chơi Bi-a', value: billiardRev, color: '#ea580c', pct: billiardPct },
    ].filter(item => item.value > 0)

    return {
      drinkRev,
      billiardRev,
      total,
      drinkPct,
      billiardPct,
      chartData,
    }
  }, [serviceRevenue, tableTypeRevenue, completedOrders])

  // 3. Payment Methods Data (Support all methods + fallback)
  const paymentChartData = useMemo(() => {
    // 1. From backend report API if available
    if (paymentMethods && paymentMethods.length > 0) {
      const rows = paymentMethods
        .map(row => {
          const key = row.method?.toUpperCase() || 'CASH'
          const cfg = METHOD_CONFIG[key] || { label: row.label || key, color: '#a37b67' }
          return {
            method: key,
            name: cfg.label,
            value: Number(row.revenue || 0),
            color: cfg.color,
          }
        })
        .filter(item => item.value > 0)
      if (rows.length > 0) {
        return rows.sort((a, b) => b.value - a.value)
      }
    }

    // 2. Fallback directly from completedOrders payments
    const map = {}
    completedOrders.forEach(o => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          const m = (p.method || 'CASH').toUpperCase()
          map[m] = (map[m] || 0) + Number(p.amount || 0)
        })
      } else {
        const m = (o.paymentMethod || 'CASH').toUpperCase()
        const amt = Number(o.finalAmount || o.totalAmount || 0)
        map[m] = (map[m] || 0) + amt
      }
    })

    const rows = Object.entries(map).map(([m, val]) => {
      const cfg = METHOD_CONFIG[m] || { label: m, color: '#a37b67' }
      return {
        method: m,
        name: cfg.label,
        value: val,
        color: cfg.color,
      }
    }).filter(item => item.value > 0)

    return rows.sort((a, b) => b.value - a.value)
  }, [paymentMethods, completedOrders])

  const totalPaymentRevenue = useMemo(() => {
    return paymentChartData.reduce((sum, item) => sum + item.value, 0)
  }, [paymentChartData])

  // 4. Top 10 Best-Selling Products
  const productChartData = useMemo(() => {
    let list = []
    if (topProducts && topProducts.length > 0) {
      list = topProducts.map(p => ({
        name: p.productName,
        quantity: Number(p.quantity || 0),
      }))
    } else if (completedOrders.length > 0) {
      // Fallback
      const pMap = {}
      completedOrders.forEach(o => {
        (o.items || []).forEach(it => {
          const name = it.product?.name || it.productName || 'Món'
          pMap[name] = (pMap[name] || 0) + Number(it.quantity || 1)
        })
      })
      list = Object.entries(pMap).map(([name, quantity]) => ({ name, quantity }))
    }

    list.sort((a, b) => b.quantity - a.quantity)
    const top10 = list.slice(0, 10)
    const totalQty = top10.reduce((sum, item) => sum + item.quantity, 0)
    const maxQty = top10.length > 0 ? top10[0].quantity : 1

    return top10.map((item, idx) => {
      let color = '#a37b67'
      if (idx === 0) color = '#f59e0b' // Gold
      else if (idx === 1) color = '#94a3b8' // Silver
      else if (idx === 2) color = '#d97706' // Bronze
      else color = COLOR_PALETTE[idx % COLOR_PALETTE.length]

      return {
        ...item,
        rank: idx + 1,
        fill: color,
        pct: totalQty > 0 ? Math.round((item.quantity / totalQty) * 1000) / 10 : 0,
        relativePct: Math.round((item.quantity / maxQty) * 100),
      }
    })
  }, [topProducts, completedOrders])

  // 5. Staff Revenue
  const staffChartData = useMemo(() => {
    let list = []
    if (staffRevenue && staffRevenue.length > 0) {
      list = staffRevenue.map(s => ({
        name: s.staffName || 'Nhân viên',
        revenue: Number(s.revenue || 0),
      }))
    } else if (completedOrders.length > 0) {
      // Fallback
      const sMap = {}
      completedOrders.forEach(o => {
        const name = o.staff?.fullName || o.staffName || 'Nhân viên'
        sMap[name] = (sMap[name] || 0) + Number(o.finalAmount || o.totalAmount || 0)
      })
      list = Object.entries(sMap).map(([name, revenue]) => ({ name, revenue }))
    }

    list.sort((a, b) => b.revenue - a.revenue)
    const totalStaffRev = list.reduce((sum, it) => sum + it.revenue, 0)
    const maxRev = list.length > 0 ? list[0].revenue : 1

    return list.map((s, idx) => ({
      ...s,
      rank: idx + 1,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      pct: totalStaffRev > 0 ? Math.round((s.revenue / totalStaffRev) * 1000) / 10 : 0,
      relativePct: Math.round((s.revenue / maxRev) * 100),
    })).filter(s => s.revenue > 0)
  }, [staffRevenue, completedOrders])

  // Key Metrics Calculations
  const calculatedOrdersRev = completedOrders.reduce((sum, o) => sum + Number(o.finalAmount || o.totalAmount || 0), 0)
  const totalRevenueVal = Number(revenue?.totalRevenue || 0) || calculatedOrdersRev
  const totalOrdersVal = Number(revenue?.totalOrders || completedOrders.length || 0)
  const avgOrderValue = totalOrdersVal > 0 ? Math.round(totalRevenueVal / totalOrdersVal) : 0

  const isLoadingAll = revenueLoading || productsLoading || staffLoading || historyLoading
    || paymentLoading || tableTypeLoading || serviceLoading

  return (
    <div className="space-y-6 pb-12">

      <DashboardHeader 
        from={from}
        to={to}
        preset={preset}
        setPreset={setPreset}
        setCustomFrom={setCustomFrom}
        setCustomTo={setCustomTo}
        refetchRevenue={refetchRevenue}
        isLoadingAll={isLoadingAll}
      />
      
      <DashboardStats 
        totalRevenueVal={totalRevenueVal}
        totalOrdersVal={totalOrdersVal}
        serviceStats={serviceStats}
        avgOrderValue={avgOrderValue}
        formatCurrency={formatCurrency}
      />
      
      <RevenueChart 
        timelineChartData={timelineChartData}
        timelineStats={timelineStats}
        isHourly={isHourly}
        formatCurrency={formatCurrency}
      />
      
      <PaymentMethodsChart 
        paymentChartData={paymentChartData}
        serviceStats={serviceStats}
        formatCurrency={formatCurrency}
        COLOR_PALETTE={COLOR_PALETTE}
        METHOD_CONFIG={METHOD_CONFIG}
      />
      
      <TopProductsTable 
        productChartData={productChartData}
        staffChartData={staffChartData}
        formatCurrency={formatCurrency}
        COLOR_PALETTE={COLOR_PALETTE}
      />
    </div>
  )
}
