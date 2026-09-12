import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/Card'
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

  // 1. Chart Data: Timeline Area Chart (Daily Revenue Trend strictly sorted ascending)
  const timelineChartData = useMemo(() => {
    if (!completedOrders.length) return []
    
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
    // Sort strictly chronological ascending
    list.sort((a, b) => a.isoDay.localeCompare(b.isoDay))
    return list.map(item => ({
      ...item,
      avgOrder: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0,
    }))
  }, [completedOrders])

  // Timeline Highlights (Peak day & daily average)
  const timelineStats = useMemo(() => {
    if (!timelineChartData.length) return { peak: null, avgDaily: 0, activeDays: 0 }
    let peak = timelineChartData[0]
    let total = 0
    timelineChartData.forEach(d => {
      total += d.revenue
      if (d.revenue > peak.revenue) peak = d
    })
    return {
      peak,
      avgDaily: Math.round(total / timelineChartData.length),
      activeDays: timelineChartData.length,
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
      {/* 1. Header & Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-brand-900 p-4 sm:p-5 rounded-2xl border border-brand-200/60 dark:border-brand-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-brand-600 to-amber-600 rounded-xl text-white shadow-sm">
              <TrendingUp size={22} />
            </div>
            <span>Báo cáo Doanh thu & Thống kê</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-500 dark:text-brand-400 mt-1.5 flex items-center gap-2">
            <span>Thời gian:</span>
            <span className="font-semibold text-brand-800 dark:text-brand-200 bg-brand-100/70 dark:bg-brand-800 px-2 py-0.5 rounded-md">
              {from}
            </span>
            <span>đến</span>
            <span className="font-semibold text-brand-800 dark:text-brand-200 bg-brand-100/70 dark:bg-brand-800 px-2 py-0.5 rounded-md">
              {to}
            </span>
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-brand-100/70 dark:bg-brand-800 p-1 rounded-xl border border-brand-200/50 dark:border-brand-700">
            <button
              onClick={() => setPreset('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'TODAY'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPreset('LAST_7_DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'LAST_7_DAYS'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setPreset('LAST_30_DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'LAST_30_DAYS'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === 'THIS_MONTH'
                  ? 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:text-brand-900'
              }`}
            >
              Tháng này
            </button>
          </div>

          {/* Custom Date Picker Inputs */}
          <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-800/40 p-1 rounded-xl border border-brand-200/60 dark:border-brand-700">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setPreset('CUSTOM')
                setCustomFrom(e.target.value)
              }}
              className="bg-white dark:bg-brand-900 text-xs px-2 py-1 rounded-lg border border-brand-200 dark:border-brand-700 outline-none text-brand-900 dark:text-brand-50 font-medium"
            />
            <span className="text-xs text-brand-400 font-bold">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setPreset('CUSTOM')
                setCustomTo(e.target.value)
              }}
              className="bg-white dark:bg-brand-900 text-xs px-2 py-1 rounded-lg border border-brand-200 dark:border-brand-700 outline-none text-brand-900 dark:text-brand-50 font-medium"
            />
          </div>

          <button
            onClick={() => refetchRevenue()}
            className="p-2 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all active:scale-95 shadow-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={isLoadingAll ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard 
          title="TỔNG DOANH THU" 
          value={formatCurrency(totalRevenueVal)} 
          subtext={`Từ ${totalOrdersVal} đơn thanh toán`}
          icon={DollarSign} 
          accentColor="from-amber-600 to-amber-700"
          badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        />
        <StatCard 
          title="DOANH THU ĐỒ UỐNG" 
          value={formatCurrency(serviceStats.drinkRev)} 
          subtext={`Chiếm ${serviceStats.drinkPct}% tổng doanh thu`}
          icon={Coffee} 
          accentColor="from-brand-600 to-brand-700"
          badgeColor="bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-200"
        />
        <StatCard 
          title="DOANH THU GIỜ BI-A" 
          value={formatCurrency(serviceStats.billiardRev)} 
          subtext={`Chiếm ${serviceStats.billiardPct}% tổng doanh thu`}
          icon={Flame} 
          accentColor="from-orange-500 to-orange-700"
          badgeColor="bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
        />
        <StatCard 
          title="ĐƠN HÀNG & AOV" 
          value={`${totalOrdersVal} đơn`} 
          subtext={`TB/Đơn: ${formatCurrency(avgOrderValue)}`}
          icon={ShoppingBag} 
          accentColor="from-teal-600 to-emerald-600"
          badgeColor="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
        />
      </div>

      {/* 3. Main Revenue Timeline Area Chart */}
      <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
                <span>Xu hướng Doanh thu theo Ngày</span>
              </CardTitle>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                Biểu đồ diễn biến doanh thu thực tế từng ngày trong kỳ
              </p>
            </div>

            {/* Micro Highlights Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {timelineStats.peak && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold">
                  <Trophy size={13} className="text-amber-600" />
                  <span>Đỉnh: {timelineStats.peak.date} ({formatCurrency(timelineStats.peak.revenue)})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-100/60 dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-semibold">
                <span>TB: {formatCurrency(timelineStats.avgDaily)}/ngày</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900 text-brand-500 dark:text-brand-400 border border-brand-200/80 dark:border-brand-700 font-medium">
                {timelineStats.activeDays} ngày có đơn
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[330px] w-full">
            {timelineChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-400 space-y-2">
                <Calendar size={42} strokeWidth={1.5} />
                <p className="text-sm font-medium">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a37b67" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#a37b67" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaddd7" opacity={0.6} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#8a6451' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#8a6451' }}
                    tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Doanh thu"
                    stroke="#a37b67" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#8a6451', strokeWidth: 1, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#a37b67', strokeWidth: 2, stroke: '#fff' }}
                    fillOpacity={1} 
                    fill="url(#revenueGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Row 2: Service Breakdown (Đồ uống vs Bi-a) & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 4.1: Service Breakdown (Đồ uống & Topping vs Giờ Bi-a) */}
        <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <Receipt size={18} className="text-brand-600 dark:text-brand-400" />
                <span>Cơ cấu Doanh thu: Đồ uống vs Giờ Bi-a</span>
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300">
                Tổng: {formatCurrency(serviceStats.total)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
            
            {/* Visual Split Segmented Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#8a6451] dark:text-[#c4a18f] flex items-center gap-1.5">
                  <Coffee size={15} />
                  <span>Đồ uống & Món ({serviceStats.drinkPct}%)</span>
                </span>
                <span className="text-[#ea580c] flex items-center gap-1.5">
                  <Flame size={15} />
                  <span>Giờ chơi Bi-a ({serviceStats.billiardPct}%)</span>
                </span>
              </div>
              <div className="w-full h-3.5 bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                <div 
                  className="h-full rounded-l-full bg-gradient-to-r from-amber-700 to-[#a37b67] transition-all duration-700" 
                  style={{ width: `${serviceStats.drinkPct || 50}%` }}
                />
                <div 
                  className="h-full rounded-r-full bg-gradient-to-r from-orange-500 to-[#ea580c] transition-all duration-700" 
                  style={{ width: `${serviceStats.billiardPct || 50}%` }}
                />
              </div>
            </div>

            {/* Donut Chart with Center Summary */}
            <div className="relative flex items-center justify-center my-2">
              <div className="h-[210px] w-full flex items-center justify-center">
                {serviceStats.chartData.length === 0 ? (
                  <div className="flex items-center justify-center text-brand-400 text-sm">
                    Chưa có doanh thu dịch vụ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceStats.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {serviceStats.chartData.map((entry, index) => (
                          <Cell key={`service-cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center Text inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-medium text-brand-500 dark:text-brand-400">Doanh thu</span>
                  <span className="text-sm sm:text-base font-black text-brand-900 dark:text-brand-50">
                    {formatCurrency(serviceStats.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2 Detailed Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <Coffee size={15} className="text-[#a37b67]" />
                    <span>Đồ uống & Món</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {serviceStats.drinkPct}%
                  </span>
                </div>
                <div className="text-lg font-black text-brand-900 dark:text-brand-50">
                  {formatCurrency(serviceStats.drinkRev)}
                </div>
                <p className="text-[11px] text-brand-500 dark:text-brand-400">
                  Cà phê, trà, nước ngọt & món gọi thêm
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-200">
                    <Flame size={15} className="text-[#ea580c]" />
                    <span>Tiền giờ Bi-a</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-200/80 dark:bg-orange-900 text-orange-900 dark:text-orange-200">
                    {serviceStats.billiardPct}%
                  </span>
                </div>
                <div className="text-lg font-black text-brand-900 dark:text-brand-50">
                  {formatCurrency(serviceStats.billiardRev)}
                </div>
                <p className="text-[11px] text-brand-500 dark:text-brand-400">
                  Thời lượng chơi bi-a tính theo giờ
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Card 4.2: Payment Methods Donut Chart & Breakdown */}
        <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-600 dark:text-brand-400" />
                <span>Phương thức Thanh toán</span>
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300">
                {paymentChartData.length} hình thức
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
            
            {/* Donut Chart */}
            <div className="relative flex items-center justify-center">
              <div className="h-[210px] w-full flex items-center justify-center">
                {paymentChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-brand-400 text-sm">
                    Chưa có giao dịch thanh toán
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentChartData.map((entry, index) => (
                          <Cell key={`pay-cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center Text inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-medium text-brand-500 dark:text-brand-400">Đã thu</span>
                  <span className="text-sm sm:text-base font-black text-brand-900 dark:text-brand-50">
                    {formatCurrency(totalPaymentRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* List with Mini Progress Bars for Each Payment Method */}
            <div className="w-full space-y-2.5 pt-3 border-t border-brand-100 dark:border-brand-800">
              {paymentChartData.map(item => {
                const pct = totalPaymentRevenue > 0 ? ((item.value / totalPaymentRevenue) * 100).toFixed(1) : 0
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-brand-800 dark:text-brand-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-900 dark:text-brand-50">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 min-w-[42px] text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

          </CardContent>
        </Card>

      </div>

      {/* 5. Row 3: Top Products & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 5.1: Top 10 Best Sellers (Ranked visual bars) */}
        <Card className="lg:col-span-2 rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <Coffee size={18} className="text-brand-600 dark:text-brand-400" />
                <span>Top 10 Món Bán Chạy Nhất</span>
              </CardTitle>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-brand-800 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-700">
                Xếp hạng theo số lượng
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {productChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-brand-400">
                <Coffee size={36} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Chưa có dữ liệu món bán chạy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 3 Podium Highlights */}
                {productChartData.length >= 3 && (
                  <div className="grid grid-cols-3 gap-2.5 mb-4 pb-4 border-b border-brand-100 dark:border-brand-800">
                    {/* Rank 2 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                      <div className="text-sm">🥈</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hạng 2</div>
                      <div className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate" title={productChartData[1].name}>
                        {productChartData[1].name}
                      </div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {productChartData[1].quantity} ly
                      </div>
                    </div>

                    {/* Rank 1 */}
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-center space-y-1 transform -translate-y-1 shadow-sm">
                      <div className="text-base">👑</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Quán quân</div>
                      <div className="text-xs font-black text-amber-900 dark:text-amber-100 truncate" title={productChartData[0].name}>
                        {productChartData[0].name}
                      </div>
                      <div className="text-xs font-black text-amber-700 dark:text-amber-300">
                        {productChartData[0].quantity} ly
                      </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-center space-y-1">
                      <div className="text-sm">🥉</div>
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Hạng 3</div>
                      <div className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate" title={productChartData[2].name}>
                        {productChartData[2].name}
                      </div>
                      <div className="text-xs font-black text-amber-800 dark:text-amber-400">
                        {productChartData[2].quantity} ly
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranked Horizontal List with Progress Bars */}
                <div className="space-y-3">
                  {productChartData.map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-black ${
                            item.rank === 1 ? 'bg-amber-400 text-amber-950' :
                            item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                            item.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300'
                          }`}>
                            {item.rank}
                          </span>
                          <span className="font-semibold text-brand-900 dark:text-brand-100">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-900 dark:text-brand-50">
                            {item.quantity} ly
                          </span>
                          <span className="text-[11px] font-medium text-brand-500 dark:text-brand-400 min-w-[38px] text-right">
                            {item.pct}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Gradient Progress Bar */}
                      <div className="w-full h-2 bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${item.relativePct}%`,
                            backgroundColor: item.fill
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 5.2: Staff Revenue Performance */}
        <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <Users size={18} className="text-brand-600 dark:text-brand-400" />
                <span>Doanh thu theo Nhân viên</span>
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300">
                {staffChartData.length} nhân viên
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            {staffChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-brand-400">
                <Users size={36} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Chưa có dữ liệu nhân viên</p>
              </div>
            ) : (
              <div className="space-y-4">
                {staffChartData.map((staff) => {
                  const initials = staff.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()
                  return (
                    <div key={staff.name} className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                            staff.rank === 1 ? 'bg-amber-500 shadow-sm' : 'bg-brand-600'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-brand-900 dark:text-brand-100 flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.rank === 1 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold">
                                  Top 1
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-brand-900 dark:text-brand-50">
                            {formatCurrency(staff.revenue)}
                          </div>
                          <div className="text-[10px] font-semibold text-brand-500 dark:text-brand-400">
                            {staff.pct}% tổng số
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-brand-200/60 dark:bg-brand-700/60 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${staff.relativePct}%`,
                            backgroundColor: staff.rank === 1 ? '#f59e0b' : '#a37b67'
                          }} 
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// Reusable Custom Tooltip for AreaChart
function CustomAreaTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload

  return (
    <div className="bg-white/95 dark:bg-brand-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-brand-700 shadow-xl text-xs space-y-1.5 min-w-[170px]">
      <div className="font-bold text-brand-900 dark:text-brand-50 border-b border-brand-100 dark:border-brand-800 pb-1 flex items-center gap-1.5">
        <Calendar size={13} className="text-brand-500" />
        <span>Ngày {label}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-brand-700 dark:text-brand-300">
        <span className="font-medium text-brand-500">Doanh thu:</span>
        <span className="font-black text-brand-900 dark:text-brand-50">
          {formatCurrency(data.revenue)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-brand-700 dark:text-brand-300">
        <span className="font-medium text-brand-500">Số đơn hàng:</span>
        <span className="font-bold text-brand-800 dark:text-brand-200">
          {data.orders} đơn
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-brand-700 dark:text-brand-300">
        <span className="font-medium text-brand-500">TB/Đơn (AOV):</span>
        <span className="font-semibold text-brand-700 dark:text-brand-300">
          {formatCurrency(data.avgOrder)}
        </span>
      </div>
    </div>
  )
}

// Reusable Custom Tooltip for Donut / PieCharts
function CustomPieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload

  return (
    <div className="bg-white/95 dark:bg-brand-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-700 shadow-xl text-xs space-y-1 min-w-[140px]">
      <div className="flex items-center gap-1.5 font-bold text-brand-900 dark:text-brand-50">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
        <span>{data.name}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-brand-700 dark:text-brand-300 pt-1 border-t border-brand-100 dark:border-brand-800">
        <span className="font-black text-brand-900 dark:text-brand-50">{formatCurrency(data.value)}</span>
        {data.pct !== undefined && (
          <span className="font-bold text-brand-500 dark:text-brand-400">{data.pct}%</span>
        )}
      </div>
    </div>
  )
}

// Reusable Metric Stat Card Component
function StatCard({ title, value, subtext, icon: Icon, accentColor, badgeColor }) {
  return (
    <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-brand-500 uppercase">{title}</span>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-sm`}>
            <Icon size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight">
            {value}
          </h3>
          {subtext && (
            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mt-1.5 ${badgeColor}`}>
              {subtext}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
