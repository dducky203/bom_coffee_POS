import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billiardApi } from '../../shared/lib/api'
import { tablesQuery } from '../../shared/lib/queries'
import { durationSecondsBetween, formatCurrency, formatDuration, formatPlayDuration, formatTimeOnly, liveElapsedSeconds } from '../../shared/lib/utils'
import { Play, Square, Clock, Coffee, Settings2 } from 'lucide-react'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import { Button } from '../../shared/components/Button'
import toast from 'react-hot-toast'

export function BilliardPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [error, setError] = useState('')
  const [confirmTableId, setConfirmTableId] = useState(null)

  const { data: tables = [], isLoading } = useQuery(tablesQuery)

  const billiardTables = useMemo(
    () => tables.filter(t => t.type === 'BILLIARD'),
    [tables]
  )

  const { data: sessions = [] } = useQuery({
    queryKey: ['billiard-sessions', billiardTables.map(t => t.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        billiardTables.map(async (table) => ({
          tableId: table.id,
          session: await billiardApi.current(table.id),
        }))
      )
      return results
    },
    enabled: billiardTables.length > 0,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const startSession = useMutation({
    mutationFn: (tableId) => billiardApi.start(tableId),
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['billiard-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
    onError: (err) => setError(err.message),
  })

  const stopSession = useMutation({
    mutationFn: ({ tableId, sessionId }) => billiardApi.stop(tableId, sessionId),
    onSuccess: async (saved) => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['billiard-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      const playTime = formatPlayDuration(durationSecondsBetween(saved.startTime, saved.endTime))
      toast.success(
        `Đã chốt ${formatTimeOnly(saved.startTime)} → ${formatTimeOnly(saved.endTime)} (${playTime}). Tổng tiền: ${formatCurrency(saved.totalAmount)}`,
        { duration: 5000, icon: '🎱' }
      )
      setConfirmTableId(null)
    },
    onError: async (err) => {
      setError(err.message)
      await queryClient.invalidateQueries({ queryKey: ['billiard-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })

  const sessionOf = (tableId) => sessions.find(s => s.tableId === tableId)?.session

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Quản lý giờ Bi-a</h1>
          <p className="text-sm text-brand-500 dark:text-brand-400">Theo dõi thời gian chơi và tính tiền</p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/billiard-pricing')}
          className="rounded-xl h-10 px-3.5 text-xs font-semibold border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50"
        >
          <Settings2 size={15} className="mr-1.5" /> Bảng giá giờ Bi-a
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {isLoading && <p className="text-brand-500 text-sm">Đang tải bàn bi-a...</p>}

      {/* Billiard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {billiardTables.map(table => {
          const activeSession = sessionOf(table.id)
          const startTime = activeSession?.startTime
          const endTime = activeSession ? now : null
          const elapsedSeconds = activeSession
            ? liveElapsedSeconds(startTime, now, activeSession.elapsedSeconds)
            : 0
          const currentPrice = Number(activeSession?.currentAmount || 0)

          return (
            <div
              key={table.id}
              className={`rounded-2xl border bg-white dark:bg-brand-900/60 transition-all overflow-hidden flex flex-col justify-between shadow-sm ${
                activeSession
                  ? 'border-brand-500/80 ring-1 ring-brand-500/20 shadow-md'
                  : 'border-brand-200 dark:border-brand-800'
              }`}
            >
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-5 h-5 rounded-full bg-zinc-800 text-white text-[11px] font-bold text-center leading-[20px]">
                      8
                    </span>
                    <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50">{table.name}</h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeSession
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300/60'
                      : 'bg-gray-100 dark:bg-brand-800 text-gray-500 dark:text-brand-400'
                  }`}>
                    {activeSession ? 'Đang chơi' : 'Trống'}
                  </span>
                </div>

                {/* Timer Box */}
                <div className="flex items-center gap-2.5 text-2xl font-mono justify-center p-3.5 bg-brand-50/80 dark:bg-brand-800/50 rounded-xl border border-brand-100 dark:border-brand-700">
                  <Clock size={20} className={activeSession ? 'text-brand-600 dark:text-brand-400' : 'text-brand-300'} />
                  <span className="font-bold tracking-wider text-brand-900 dark:text-brand-50">
                    {formatDuration(elapsedSeconds)}
                  </span>
                </div>

                {/* Details */}
                <div className="text-xs space-y-2 text-brand-700 dark:text-brand-300">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-500">Giờ bắt đầu</span>
                    <span className="font-mono font-semibold text-brand-900 dark:text-brand-100">
                      {startTime ? formatTimeOnly(startTime) : '--:--:--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-brand-500">{activeSession ? 'Hiện tại' : 'Giờ kết thúc'}</span>
                    <span className="font-mono font-semibold text-brand-900 dark:text-brand-100">
                      {endTime ? formatTimeOnly(endTime) : '--:--:--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-brand-500">Thời gian chơi</span>
                    <span className="font-semibold text-brand-900 dark:text-brand-100">
                      {activeSession ? formatPlayDuration(elapsedSeconds) : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-brand-100 dark:border-brand-800">
                    <span className="font-medium text-brand-600 dark:text-brand-400">Tiền giờ tạm tính</span>
                    <span className="font-bold text-sm text-brand-900 dark:text-brand-50">
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {!activeSession ? (
                    <Button
                      onClick={() => startSession.mutate(table.id)}
                      disabled={startSession.isPending}
                      className="w-full h-11 gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl text-xs"
                    >
                      <Play size={16} /> Bắt đầu tính giờ
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/order/${table.id}`)}
                        className="h-11 gap-1.5 text-xs font-semibold rounded-xl border-brand-200 text-brand-700 hover:bg-brand-50"
                      >
                        <Coffee size={15} /> Gọi nước
                      </Button>

                      <Button
                        onClick={() => setConfirmTableId(table.id)}
                        disabled={stopSession.isPending}
                        className="h-11 gap-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
                      >
                        <Square size={14} /> Kết thúc
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        isOpen={!!confirmTableId}
        onClose={() => setConfirmTableId(null)}
        onConfirm={() => stopSession.mutate({
          tableId: confirmTableId,
          sessionId: sessionOf(confirmTableId)?.sessionId,
        })}
        title="Kết thúc giờ chơi Bi-a"
        message={(() => {
          const session = sessionOf(confirmTableId)
          if (!session) return 'Bạn có chắc chắn muốn kết thúc giờ chơi và tính tiền cho bàn này không?'
          const elapsed = durationSecondsBetween(session.startTime, now)
          return `Giờ bắt đầu: ${formatTimeOnly(session.startTime)}\nGiờ kết thúc: ${formatTimeOnly(now)}\nThời gian: ${formatPlayDuration(elapsed)}\nTiền giờ: ${formatCurrency(session.currentAmount)}\n\nChốt phiên này?`
        })()}
      />
    </div>
  )
}
