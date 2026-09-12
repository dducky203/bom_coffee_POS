import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/components/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Award, Trophy, Crown, Users, Coffee } from "lucide-react";

export function TopProductsTable({
  productChartData,
  staffChartData,
  formatCurrency,
  COLOR_PALETTE,
}) {
  return (
    <>
      {/* 5. Row 3: Top Products & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 5.1: Top 10 Best Sellers (Ranked visual bars) */}
        <Card className="lg:col-span-2 rounded-2xl border-brand-200/60 dark:border-brand-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-brand-50/40 dark:bg-brand-900/40 border-b border-brand-100 dark:border-brand-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-900 dark:text-brand-50 flex items-center gap-2">
                <Coffee
                  size={18}
                  className="text-brand-600 dark:text-brand-400"
                />
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
                <p className="text-sm font-medium">
                  Chưa có dữ liệu món bán chạy
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 3 Podium Highlights */}
                {productChartData.length >= 3 && (
                  <div className="grid grid-cols-3 gap-2.5 mb-4 pb-4 border-b border-brand-100 dark:border-brand-800">
                    {/* Rank 2 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                      <div className="text-sm">🥈</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Hạng 2
                      </div>
                      <div
                        className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate"
                        title={productChartData[1].name}
                      >
                        {productChartData[1].name}
                      </div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {productChartData[1].quantity} ly
                      </div>
                    </div>

                    {/* Rank 1 */}
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-center space-y-1 transform -translate-y-1 shadow-sm">
                      <div className="text-base">👑</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        Quán quân
                      </div>
                      <div
                        className="text-xs font-black text-amber-900 dark:text-amber-100 truncate"
                        title={productChartData[0].name}
                      >
                        {productChartData[0].name}
                      </div>
                      <div className="text-xs font-black text-amber-700 dark:text-amber-300">
                        {productChartData[0].quantity} ly
                      </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-center space-y-1">
                      <div className="text-sm">🥉</div>
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Hạng 3
                      </div>
                      <div
                        className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate"
                        title={productChartData[2].name}
                      >
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
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-black ${
                              item.rank === 1
                                ? "bg-amber-400 text-amber-950"
                                : item.rank === 2
                                  ? "bg-slate-300 text-slate-800"
                                  : item.rank === 3
                                    ? "bg-amber-600 text-white"
                                    : "bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300"
                            }`}
                          >
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
                            backgroundColor: item.fill,
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
                <Users
                  size={18}
                  className="text-brand-600 dark:text-brand-400"
                />
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
                  const initials = staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")
                    .toUpperCase();
                  return (
                    <div
                      key={staff.name}
                      className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                              staff.rank === 1
                                ? "bg-amber-500 shadow-sm"
                                : "bg-brand-600"
                            }`}
                          >
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
                            backgroundColor:
                              staff.rank === 1 ? "#f59e0b" : "#a37b67",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
