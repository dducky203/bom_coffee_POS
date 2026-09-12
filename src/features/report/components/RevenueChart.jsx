import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/Card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, Trophy } from 'lucide-react'
import { formatCurrency as _fc } from '../../../shared/lib/utils'

function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-700 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-brand-500 dark:text-brand-400 mb-1">{label}</p>
        <p className="text-sm font-black text-brand-900 dark:text-brand-50">{_fc(payload[0].value)}</p>
        {payload[1] && <p className="text-xs text-brand-600 dark:text-brand-300">{payload[1].value} đơn</p>}
      </div>
    )
  }
  return null
}

export function RevenueChart({ timelineChartData, timelineStats, isHourly, formatCurrency }) {
  return (
    <>
    {/* 3. Main Revenue Timeline Area Chart */}
      <Card className="rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
                <span>{isHourly ? 'Doanh thu Hôm nay theo Giờ' : 'Xu hướng Doanh thu theo Ngày'}</span>
              </CardTitle>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                {isHourly ? 'Biểu đồ doanh thu từng giờ (06:00 → 01:00)' : 'Biểu đồ diễn biến doanh thu thực tế từng ngày trong kỳ'}
              </p>
            </div>

            {/* Micro Highlights Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {timelineStats.peak && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold">
                  <Trophy size={13} className="text-amber-600" />
                  <span>{isHourly ? 'Đỉnh: ' : 'Đỉnh: '}{timelineStats.peak.date} ({formatCurrency(timelineStats.peak.revenue)})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-100/60 dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-semibold">
                <span>TB: {formatCurrency(timelineStats.avgDaily)}/{isHourly ? 'giờ' : 'ngày'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900 text-brand-500 dark:text-brand-400 border border-brand-200/80 dark:border-brand-700 font-medium">
                {timelineStats.activeDays} {isHourly ? 'giờ có đơn' : 'ngày có đơn'}
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
    </>
  )
}
