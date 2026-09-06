import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/Card'
import { formatCurrency } from '../../shared/lib/utils'
import { reportApi } from '../../shared/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, ShoppingBag, Coffee } from 'lucide-react'

const COLORS = ['#a37b67', '#ea580c', '#78716c', '#0f766e']

export function DashboardPage() {
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const { data: revenue, isLoading, error } = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn: () => reportApi.revenue(from, to),
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['report-top-products', from, to],
    queryFn: () => reportApi.topProducts(from, to),
  })

  const { data: staffRevenue = [] } = useQuery({
    queryKey: ['report-staff', from, to],
    queryFn: () => reportApi.revenueByStaff(from, to),
  })

  const productChart = topProducts.map(p => ({
    name: p.productName,
    value: Number(p.quantity),
  }))

  const staffChart = staffRevenue.map((s, index) => ({
    name: s.staffName,
    value: Number(s.revenue),
    color: COLORS[index % COLORS.length],
  }))

  const StatCard = ({ title, value, icon: Icon }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-brand-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50">{value}</h3>
          </div>
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-lg">
            <Icon className="text-brand-600 dark:text-brand-400" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Tổng quan doanh thu</h1>
        <p className="text-brand-500 dark:text-brand-400">Thống kê {from} → {to}</p>
      </div>

      {isLoading && <p className="text-brand-500">Đang tải báo cáo...</p>}
      {error && <p className="text-red-600">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng doanh thu" value={formatCurrency(revenue?.totalRevenue || 0)} icon={TrendingUp} />
        <StatCard title="Số đơn hàng" value={String(revenue?.totalOrders ?? 0)} icon={ShoppingBag} />
        <StatCard title="Top món" value={String(topProducts.length)} icon={Coffee} />
        <StatCard title="Nhân viên có doanh thu" value={String(staffRevenue.length)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top món bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {productChart.length === 0 ? (
                <p className="text-brand-400 text-center py-16">Chưa có dữ liệu đơn đã thanh toán</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaddd7" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f2e8e5' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="value" fill="#a37b67" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo nhân viên</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              {staffChart.length === 0 ? (
                <p className="text-brand-400 text-center py-16">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={staffChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {staffChart.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4 w-full flex-wrap">
              {staffChart.map(cat => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm font-medium text-brand-700">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
