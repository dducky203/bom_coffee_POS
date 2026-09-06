import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kdsApi } from '../../shared/lib/api'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { Clock, CheckCircle2, PlayCircle } from 'lucide-react'
import { format } from 'date-fns'

function tableNameOf(item) {
  return item.order?.table?.name || `Đơn #${item.order?.id || item.id}`
}

export function KdsPage() {
  const queryClient = useQueryClient()
  const { data: queue = [], isLoading, error } = useQuery({
    queryKey: ['kds-queue'],
    queryFn: kdsApi.queue,
    refetchInterval: 60_000,
  })

  const updateGroupStatus = useMutation({
    mutationFn: async ({ itemsToUpdate, status }) => {
      await Promise.all(itemsToUpdate.map(item => kdsApi.updateStatus(item.id, status)))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kds-queue'] }),
  })

  const Column = ({ title, status, items, icon: Icon, colorClass }) => {
    const groups = items.reduce((acc, item) => {
      const key = status === 'DONE'
        ? `order-${item.order?.id || item.id}`
        : (item.order?.table?.id ? `table-${item.order?.table?.id}` : `order-${item.order?.id || item.id}`)
      
      const itemTime = new Date(status === 'DONE' ? (item.updatedAt || item.createdAt) : item.createdAt).getTime()
      
      if (!acc[key]) acc[key] = { items: [], time: itemTime, tableName: tableNameOf(item) }
      acc[key].items.push(item)
      
      if (status === 'DONE') {
        acc[key].time = Math.max(acc[key].time, itemTime)
      } else {
        acc[key].time = Math.min(acc[key].time, itemTime)
      }
      return acc
    }, {})

    const sortedGroups = Object.values(groups).sort((a, b) => {
      return status === 'DONE' ? b.time - a.time : a.time - b.time
    })

    return (
      <div className="flex flex-col bg-brand-50/50 dark:bg-brand-900/50 rounded-xl p-4 min-h-[300px] md:min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-brand-900 dark:text-brand-50 flex items-center gap-2">
            <Icon className={colorClass} size={20} />
            {title}
          </h2>
          <Badge variant="outline" className="bg-white">{items.length}</Badge>
        </div>
        <div className="flex flex-col gap-3">
          {sortedGroups.map((group, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-brand-100">
                  <span className="font-bold text-lg text-brand-900">{group.tableName}</span>
                  <span className="text-sm text-brand-500 flex items-center gap-1">
                    <Clock size={14} />
                    {format(new Date(group.time), 'HH:mm')}
                  </span>
                </div>
                <div className="mb-4 space-y-3">
                  {group.items.map(item => (
                    <div key={item.id} className="flex flex-col">
                      <p className="font-semibold text-brand-900">{item.quantity}x {item.product?.name}</p>
                      {item.note && <p className="text-sm text-red-500 italic mt-0.5">Lưu ý: {item.note}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {status === 'PENDING' && (
                    <button
                      onClick={() => updateGroupStatus.mutate({ itemsToUpdate: group.items, status: 'IN_PROGRESS' })}
                      disabled={updateGroupStatus.isPending}
                      className="w-full justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-3 md:py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <PlayCircle size={18} /> Bắt đầu làm ({group.items.length} món)
                    </button>
                  )}
                  {status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateGroupStatus.mutate({ itemsToUpdate: group.items, status: 'DONE' })}
                      disabled={updateGroupStatus.isPending}
                      className="w-full justify-center text-green-600 bg-green-50 hover:bg-green-100 px-4 py-3 md:py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} /> Hoàn thành ({group.items.length} món)
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {sortedGroups.length === 0 && (
            <div className="text-center text-brand-400 py-10 border-2 border-dashed border-brand-200 rounded-xl">
              Trống
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">KDS - Pha chế</h1>
        <p className="text-brand-500 dark:text-brand-400">Quản lý hàng đợi món ăn/thức uống</p>
      </div>

      {isLoading && <p className="text-brand-500">Đang tải hàng đợi...</p>}
      {error && <p className="text-red-600">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <Column
          title="Chờ làm"
          status="PENDING"
          items={queue.filter(i => i.status === 'PENDING')}
          icon={Clock}
          colorClass="text-yellow-500"
        />
        <Column
          title="Đang làm"
          status="IN_PROGRESS"
          items={queue.filter(i => i.status === 'IN_PROGRESS')}
          icon={PlayCircle}
          colorClass="text-blue-500"
        />
        <Column
          title="Đã xong"
          status="DONE"
          items={queue.filter(i => i.status === 'DONE')}
          icon={CheckCircle2}
          colorClass="text-green-500"
        />
      </div>
    </div>
  )
}
