import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billiardApi, tableApi } from '../../shared/lib/api'
import { Card, CardContent } from '../../shared/components/Card'
import { Button } from '../../shared/components/Button'
import { formatCurrency, formatDuration } from '../../shared/lib/utils'
import { Play, Square, Clock } from 'lucide-react'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import toast from 'react-hot-toast'

export function BilliardPage() {
  const queryClient = useQueryClient()
  const [now, setNow] = useState(new Date())
  const [error, setError] = useState('')
  const [confirmTableId, setConfirmTableId] = useState(null)

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tableApi.list,
  })

  const billiardTables = tables.filter(t => t.type === 'BILLIARD')

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tables'] })
    queryClient.invalidateQueries({ queryKey: ['billiard-sessions'] })
  }

  const startSession = useMutation({
    mutationFn: (tableId) => billiardApi.start(tableId),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const stopSession = useMutation({
    mutationFn: (tableId) => billiardApi.stop(tableId),
    onSuccess: (saved) => {
      setError('')
      invalidate()
      toast.success(`Đã kết thúc giờ chơi. Tổng tiền: ${formatCurrency(saved.totalAmount)}`, {
        duration: 5000,
        icon: '🎱'
      })
      setConfirmTableId(null)
    },
    onError: (err) => setError(err.message),
  })

  const sessionOf = (tableId) => sessions.find(s => s.tableId === tableId)?.session

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">Quản lý giờ Bi-a</h1>
        <p className="text-brand-500 dark:text-brand-400">Theo dõi thời gian chơi và tính tiền</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {isLoading && <p className="text-brand-500">Đang tải bàn bi-a...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {billiardTables.map(table => {
          const activeSession = sessionOf(table.id)
          let elapsedSeconds = 0
          let currentPrice = 0

          if (activeSession) {
            elapsedSeconds = activeSession.elapsedSeconds
              ?? Math.floor((now.getTime() - new Date(activeSession.startTime).getTime()) / 1000)
            currentPrice = Number(activeSession.currentAmount || 0)
          }

          return (
            <Card key={table.id} className={`overflow-hidden transition-all ${activeSession ? 'border-brand-500 shadow-md shadow-brand-500/20' : ''}`}>
              <div className={`h-2 w-full ${activeSession ? 'bg-brand-500' : 'bg-gray-200'}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{table.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activeSession ? 'bg-brand-100 text-brand-800' : 'bg-gray-100 text-gray-500'}`}>
                    {activeSession ? 'Đang chơi' : 'Trống'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-2xl font-mono justify-center p-4 bg-gray-50 dark:bg-brand-800 rounded-lg">
                    <Clock size={24} className={activeSession ? 'text-brand-500 animate-pulse' : 'text-gray-400'} />
                    <span>{formatDuration(elapsedSeconds)}</span>
                  </div>

                  <div className="pt-4 border-t border-brand-100 dark:border-brand-700">
                    {!activeSession ? (
                      <Button onClick={() => startSession.mutate(table.id)} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                        <Play size={18} /> Bắt đầu
                      </Button>
                    ) : (
                      <Button onClick={() => setConfirmTableId(table.id)} className="w-full gap-2" variant="destructive">
                        <Square size={18} /> Kết thúc
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmModal
        isOpen={!!confirmTableId}
        onClose={() => setConfirmTableId(null)}
        onConfirm={() => stopSession.mutate(confirmTableId)}
        title="Kết thúc giờ chơi Bi-a"
        message="Bạn có chắc chắn muốn kết thúc giờ chơi và tính tiền cho bàn này không?"
        confirmText="Kết thúc & Tính tiền"
        cancelText="Hủy"
        isDestructive={false}
        isLoading={stopSession.isPending}
      />
    </div>
  )
}
