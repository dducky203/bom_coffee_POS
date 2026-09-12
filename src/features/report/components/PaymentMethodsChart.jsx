import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/Card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Receipt, CreditCard, Coffee, Flame } from 'lucide-react'
import { formatCurrency as _fc } from '../../../shared/lib/utils'

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload
    return (
      <div className="bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-700 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-brand-800 dark:text-brand-200">{name}</p>
        <p className="text-sm font-black text-brand-900 dark:text-brand-50">{_fc(value)}</p>
      </div>
    )
  }
  return null
}

export function PaymentMethodsChart({ paymentChartData, serviceStats, formatCurrency, COLOR_PALETTE, METHOD_CONFIG }) {
  const totalPaymentRevenue = paymentChartData.reduce((sum, item) => sum + item.value, 0)
  return (
    <>
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
    </>
  )
}
