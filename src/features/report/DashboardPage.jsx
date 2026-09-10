import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, parseISO, isSameDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/Card'
import { formatCurrency } from '../../shared/lib/utils'
import { reportApi, historyApi } from '../../shared/lib/api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts'
import { 
  TrendingUp, Users, ShoppingBag, Coffee, Calendar, RefreshCw, 
  CreditCard, MonitorPlay, Receipt, DollarSign, Award
} from 'lucide-react'

const COLOR_PALETTE = [
  '#a37b67', '#ea580c', '#0f766e', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
]

const PAYMENT_LABELS = {
  CASH: 'Tiền mặt',
  QR: 'Chuyển khoản QR',
  BANK_TRANSFER: 'Chuyển khoản NH',
  CARD: 'Thẻ ATM/Visa'
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
    queryFn: () => historyApi.getOrders({ from, to, size: 500 }),
  })

  const orders = historyData?.content || []
  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID')
  }, [orders])

  // Chart 1 Data: Timeline Area Chart (Daily Revenue Trend)
  const timelineChartData = useMemo(() => {
    if (!completedOrders.length) return []
    
    const map = new Map()
    completedOrders.forEach(o => {
      const dateKey = o.closedAt || o.createdAt
      if (!dateKey) return
      const dateStr = format(parseISO(dateKey), 'dd/MM')
      const amt = Number(o.finalAmount || o.totalAmount || 0)
      if (map.has(dateStr)) {
        const cur = map.get(dateStr)
        map.set(dateStr, { date: dateStr, revenue: cur.revenue + amt, orders: cur.orders + 1 })
      } else {
        map.set(dateStr, { date: dateStr, revenue: amt, orders: 1 })
      }
    })

    return Array.from(map.values()).reverse()
  }, [completedOrders])

  // Chart 2 Data: Top Products Bar Chart
  const productChartData = useMemo(() => {
    return topProducts.map((p, idx) => ({
      name: p.productName,
      quantity: Number(p.quantity),
      fill: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }))
  }, [topProducts])

  // Chart 3 Data: Payment Methods Donut Chart
  const paymentChartData = useMemo(() => {
    const counts = {}
    completedOrders.forEach(o => {
      const method = o.paymentMethod || 'CASH'
      const amt = Number(o.finalAmount || o.totalAmount || 0)
      counts[method] = (counts[method] || 0) + amt
    })

    return Object.entries(counts).map(([method, val], idx) => ({
      name: PAYMENT_LABELS[method] || method,
      value: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }))
  }, [completedOrders])

  // Chart 4 Data: Staff Revenue Pie/Bar
  const staffChartData = useMemo(() => {
    return staffRevenue.map((s, index) => ({
      name: s.staffName,
      revenue: Number(s.revenue),
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }))
  }, [staffRevenue])

  // Chart 5 Data: Table Type Service Breakdown (Drink vs Billiard)
  const tableTypeChartData = useMemo(() => {
    let drinkRev = 0
    let billiardRev = 0
    completedOrders.forEach(o => {
      const amt = Number(o.finalAmount || o.totalAmount || 0)
      if (o.tableType === 'BILLIARD' || o.billiardId) {
        billiardRev += amt
      } else {
        drinkRev += amt
      }
    })

    return [
      { type: 'Bàn Nước (Đồ uống)', revenue: drinkRev, fill: '#a37b67' },
      { type: 'Bàn Bi-a (Giờ chơi & Nước)', revenue: billiardRev, fill: '#ea580c' },
    ].filter(item => item.revenue > 0)
  }, [completedOrders])

  // Key Metrics Calculations
  const totalRevenueVal = Number(revenue?.totalRevenue || 0)
  const totalOrdersVal = Number(revenue?.totalOrders || completedOrders.length || 0)
  const avgOrderValue = totalOrdersVal > 0 ? Math.round(totalRevenueVal / totalOrdersVal) : 0

  const isLoadingAll = revenueLoading || productsLoading || staffLoading || historyLoading

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-brand-900 p-4 sm:p-5 rounded-2xl border border-brand-200/60 dark:border-brand-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-accent" size={26} />
            Báo cáo Doanh thu & Thống kê
          </h1>
          <p className="text-xs sm:text-sm text-brand-500 dark:text-brand-400 mt-1">
            Theo dõi chi tiết hiệu suất bán hàng từ <span className="font-semibold text-brand-700 dark:text-brand-300">{from}</span> đến <span className="font-semibold text-brand-700 dark:text-brand-300">{to}</span>
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

          {/* Custom Date Picker Toggle */}
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

      {/* Metric KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard 
          title="TỔNG DOANH THU" 
          value={formatCurrency(totalRevenueVal)} 
          subtext={`Từ ${totalOrdersVal} đơn hàng`}
          icon={DollarSign} 
          accentColor="from-brand-600 to-brand-700"
          badgeColor="bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-200"
        />
        <StatCard 
          title="TỔNG ĐƠN HÀNG" 
          value={`${totalOrdersVal} đơn`} 
          subtext="Hoàn thành & đã thanh toán"
          icon={ShoppingBag} 
          accentColor="from-amber-500 to-orange-600"
          badgeColor="bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
        />
        <StatCard 
          title="DOANH THU TRUNG BÌNH/ĐƠN" 
          value={formatCurrency(avgOrderValue)} 
          subtext="Chỉ số AOV (Average Order Value)"
          icon={Receipt} 
          accentColor="from-teal-600 to-emerald-600"
          badgeColor="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
        />
        <StatCard 
          title="TOP MÓN & NHÂN VIÊN" 
          value={`${topProducts.length} món`} 
          subtext={`${staffRevenue.length} nhân viên phát sinh doanh thu`}
          icon={Award} 
          accentColor="from-purple-600 to-indigo-600"
          badgeColor="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
        />
      </div>

      {/* Row 1: Main Revenue Timeline Area Chart */}
      <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
              <span>Biểu đồ Xu hướng Doanh thu theo Thời gian</span>
            </CardTitle>
            <span className="text-xs font-semibold text-brand-500 bg-white dark:bg-brand-800 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-700">
              {timelineChartData.length} ngày ghi nhận
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[320px] w-full">
            {timelineChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-400 space-y-2">
                <Calendar size={40} strokeWidth={1.5} />
                <p className="text-sm font-medium">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a37b67" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a37b67" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaddd7" opacity={0.6} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8a6451' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#8a6451' }}
                    tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #eaddd7',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#a37b67" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Top Products Bar Chart & Payment Method Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Products Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
              <Coffee size={18} className="text-brand-600 dark:text-brand-400" />
              <span>Top 10 Món Bán Chạy Nhất (Theo số lượng)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              {productChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-400">
                  <p className="text-sm font-medium">Chưa có dữ liệu món bán chạy</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaddd7" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      interval={0} 
                      angle={-25} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 11, fill: '#8a6451' }} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8a6451' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #eaddd7' }}
                      formatter={(val) => [`${val} ly/suất`, 'Số lượng']}
                    />
                    <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                      {productChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Donut Chart */}
        <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
              <CreditCard size={18} className="text-brand-600 dark:text-brand-400" />
              <span>Phương thức Thanh toán</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              {paymentChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-brand-400">
                  <p className="text-sm font-medium">Chưa có dữ liệu thanh toán</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-3 w-full">
              {paymentChartData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-800 px-2.5 py-1 rounded-lg border border-brand-100 dark:border-brand-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Staff Revenue Breakdown & Service Type Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Performance Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
              <Users size={18} className="text-brand-600 dark:text-brand-400" />
              <span>Doanh thu theo Nhân viên Bán hàng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              {staffChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-brand-400">
                  <p className="text-sm font-medium">Chưa có dữ liệu doanh thu nhân viên</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffChartData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eaddd7" opacity={0.6} />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#694a3a', fontWeight: 600 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {staffChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Type / Service Breakdown Chart */}
        <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
              <MonitorPlay size={18} className="text-brand-600 dark:text-brand-400" />
              <span>Cơ cấu Bàn Nước vs Bàn Bi-a</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              {tableTypeChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-brand-400">
                  <p className="text-sm font-medium">Chưa có dữ liệu loại bàn</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tableTypeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaddd7" opacity={0.6} />
                    <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a6451' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val) => [formatCurrency(val), 'Doanh thu']} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {tableTypeChartData.map((entry) => (
                        <Cell key={entry.type} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="w-full space-y-2 mt-3 pt-3 border-t border-brand-100 dark:border-brand-800">
              {tableTypeChartData.map(item => (
                <div key={item.type} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.type}
                  </span>
                  <span className="font-bold text-brand-900 dark:text-brand-50">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Reusable Stat Card Component
function StatCard({ title, value, subtext, icon: Icon, accentColor, badgeColor }) {
  return (
    <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-brand-500 uppercase">{title}</span>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-sm`}>
            <Icon size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight">
            {value}
          </h3>
          {subtext && (
            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md mt-1.5 ${badgeColor}`}>
              {subtext}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

