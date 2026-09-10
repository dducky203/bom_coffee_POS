import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kdsApi } from '../../shared/lib/api'
import { audioService } from '../../shared/lib/audioService'
import { useAuthStore } from '../../app/store'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { Button } from '../../shared/components/Button'
import { Clock, CheckCircle2, PlayCircle, Volume2, VolumeX } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const DONE_PAGE_SIZE = 6

function tableNameOf(item) {
  return item.order?.table?.name || `Đơn #${item.order?.id || item.id}`
}

function groupItems(items, status) {
  const groups = items.reduce((acc, item) => {
    const key = status === 'DONE'
      ? `order-${item.order?.id || item.id}`
      : (item.order?.table?.id ? `table-${item.order?.table?.id}` : `order-${item.order?.id || item.id}`)

    const itemTime = new Date(status === 'DONE' ? (item.updatedAt || item.createdAt) : item.createdAt).getTime()

    if (!acc[key]) acc[key] = {
      items: [],
      time: itemTime,
      tableName: tableNameOf(item),
      customerName: item.order?.customerName || '',
    }
    acc[key].items.push(item)

    acc[key].time = status === 'DONE'
      ? Math.max(acc[key].time, itemTime)
      : Math.min(acc[key].time, itemTime)
    return acc
  }, {})

  return Object.values(groups).sort((a, b) => status === 'DONE' ? b.time - a.time : a.time - b.time)
}

export function KdsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const [showAll, setShowAll] = useState(false)
  const [doneLimit, setDoneLimit] = useState(DONE_PAGE_SIZE)

  // Sound alert state with localStorage persistence via audioService
  const [soundEnabled, setSoundEnabled] = useState(() => audioService.getSoundEnabled())

  const toggleSound = () => {
    const next = !soundEnabled
    audioService.unlock()
    setSoundEnabled(next)
    audioService.setSoundEnabled(next)
    if (next) {
      if (pending.length === 0) {
        audioService.speakText('Đã bật âm thanh pha chế')
      }
    } else {
      audioService.stop()
    }
  }

  const loadAll = isAdmin && showAll

  // Refetch queue every 30 seconds
  const { data: queue = [], isLoading, error } = useQuery({
    queryKey: ['kds-queue', loadAll],
    queryFn: () => kdsApi.queue(loadAll),
    refetchInterval: 60_000, // 60 seconds
  })

  const pending = useMemo(() => queue.filter(i => i.status === 'PENDING'), [queue])
  const inProgress = useMemo(() => queue.filter(i => i.status === 'IN_PROGRESS'), [queue])
  const done = useMemo(() => queue.filter(i => i.status === 'DONE'), [queue])
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const updateGroupStatus = useMutation({
    mutationFn: async ({ itemsToUpdate, status }) => {
      await Promise.all(itemsToUpdate.map(item => kdsApi.updateStatus(item.id, status)))
    },
    onSuccess: (_data, { itemsToUpdate }) => {
      queryClient.invalidateQueries({ queryKey: ['kds-queue'] })
      const remaining = pendingRef.current.filter(item => !itemsToUpdate.some(moved => moved.id === item.id))
      audioService.stop()
      audioService.announcePendingQueue(groupItems(remaining, 'PENDING'))
    },
  })

  const pendingIdsRef = useRef(null)
  const primedSoundRef = useRef(false)

  useEffect(() => {
    audioService.setKdsActive(true)
    const unlockOnGesture = () => audioService.unlock()
    window.addEventListener('click', unlockOnGesture, { once: true })
    window.addEventListener('keydown', unlockOnGesture, { once: true })
    return () => {
      audioService.setKdsActive(false)
      window.removeEventListener('click', unlockOnGesture)
      window.removeEventListener('keydown', unlockOnGesture)
    }
  }, [])

  useEffect(() => {
    if (!soundEnabled) {
      pendingIdsRef.current = null
      primedSoundRef.current = false
      audioService.stop()
      return
    }

    const pendingGroups = groupItems(pending, 'PENDING')
    const currentIds = new Set(pending.map(item => item.id))
    const prevIds = pendingIdsRef.current

    if (!primedSoundRef.current || prevIds == null) {
      primedSoundRef.current = true
      pendingIdsRef.current = currentIds
      if (pending.length > 0) {
        audioService.announcePendingQueue(pendingGroups)
      }
      return
    }

    const newItems = pending.filter(item => !prevIds.has(item.id))
    if (newItems.length > 0) {
      groupItems(newItems, 'PENDING').forEach(group => {
        audioService.announceNewOrder({
          tableName: group.tableName,
          items: group.items,
          itemCount: group.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
        })
      })
    }

    pendingIdsRef.current = currentIds
  }, [pending, soundEnabled])

  // Periodic reminder voice alert every 2 minutes (120,000ms) if pending orders remain unhandled
  useEffect(() => {
    if (!soundEnabled || pending.length === 0) return undefined

    const timer = setInterval(() => {
      if (pending.length > 0) {
        audioService.remindPending(pending.length)
      }
    }, 2 * 60 * 1000)

    return () => clearInterval(timer)
  }, [pending.length, soundEnabled])

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-50">KDS - Pha chế</h1>
          <p className="text-brand-500 dark:text-brand-400">
            {loadAll
              ? 'Đang xem tất cả đơn'
              : `Đơn hôm nay, ${format(new Date(), 'dd/MM/yyyy', { locale: vi })}`}
            {soundEnabled ? ' · Giọng Việt sẽ đọc khi có đơn chờ' : ' · Âm thanh đang tắt'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Alert Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              soundEnabled 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-amber-500/20 scale-[1.02]' 
                : 'bg-white dark:bg-brand-800 text-brand-500 dark:text-brand-400 border-brand-200 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            title={soundEnabled ? 'Tắt giọng thông báo tiếng Việt' : 'Bật giọng thông báo tiếng Việt'}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={18} className="animate-pulse" />
                <span>Giọng Việt: Bật</span>
              </>
            ) : (
              <>
                <VolumeX size={18} />
                <span>Giọng Việt: Tắt</span>
              </>
            )}
          </button>

          {isAdmin && (
            <div className="flex rounded-xl border border-brand-200 dark:border-brand-700 overflow-hidden bg-white dark:bg-brand-800 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => { setShowAll(false); setDoneLimit(DONE_PAGE_SIZE) }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!showAll ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'}`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => { setShowAll(true); setDoneLimit(DONE_PAGE_SIZE) }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${showAll ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700'}`}
              >
                Tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && <p className="text-brand-500">Đang tải hàng đợi...</p>}
      {error && <p className="text-red-600">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <Column
          title="Chờ làm"
          status="PENDING"
          items={pending}
          icon={Clock}
          colorClass="text-yellow-500"
          onUpdate={updateGroupStatus.mutate}
          isUpdating={updateGroupStatus.isPending}
        />
        <Column
          title="Đang làm"
          status="IN_PROGRESS"
          items={inProgress}
          icon={PlayCircle}
          colorClass="text-blue-500"
          onUpdate={updateGroupStatus.mutate}
          isUpdating={updateGroupStatus.isPending}
        />
        <Column
          title="Đã xong"
          status="DONE"
          items={done}
          icon={CheckCircle2}
          colorClass="text-green-500"
          visibleLimit={doneLimit}
          onLoadMore={() => setDoneLimit(n => n + DONE_PAGE_SIZE)}
        />
      </div>
    </div>
  )
}

function Column({ title, status, items, icon: Icon, colorClass, onUpdate, isUpdating, visibleLimit, onLoadMore }) {
  const sortedGroups = useMemo(() => groupItems(items, status), [items, status])
  const visibleGroups = visibleLimit ? sortedGroups.slice(0, visibleLimit) : sortedGroups
  const remaining = visibleLimit ? Math.max(sortedGroups.length - visibleLimit, 0) : 0

  return (
    <div className="flex flex-col bg-brand-50/50 dark:bg-brand-900/50 rounded-xl p-4 min-h-[280px] max-h-[70vh] md:max-h-none md:h-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="font-bold text-lg text-brand-900 dark:text-brand-50 flex items-center gap-2">
          <Icon className={colorClass} size={20} />
          {title}
        </h2>
        <Badge variant="outline" className="bg-white">{sortedGroups.length}</Badge>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
        {visibleGroups.map((group, idx) => (
          <Card key={`${group.tableName}-${group.time}-${idx}`} className="hover:shadow-md transition-shadow shrink-0">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3 pb-2 border-b border-brand-100">
                <div>
                  <span className="font-bold text-lg text-brand-900">{group.tableName}</span>
                  {group.customerName && (
                    <p className="text-xs text-brand-500 mt-0.5">Chủ bàn: {group.customerName}</p>
                  )}
                </div>
                <span className="text-sm text-brand-500 flex items-center gap-1">
                  <Clock size={14} />
                  {format(new Date(group.time), 'HH:mm')}
                </span>
              </div>
              <div className={`space-y-3 ${status !== 'DONE' ? 'mb-4' : ''}`}>
                {group.items.map(item => (
                  <div key={item.id} className="flex flex-col">
                    <p className="font-semibold text-brand-900">{item.quantity}x {item.product?.name}</p>
                    {item.note && <p className="text-sm text-red-500 italic mt-0.5">Lưu ý: {item.note}</p>}
                  </div>
                ))}
              </div>
              {status === 'PENDING' && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => onUpdate({ itemsToUpdate: group.items, status: 'IN_PROGRESS' })}
                    disabled={isUpdating}
                    className="w-full justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-3 md:py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <PlayCircle size={18} /> Bắt đầu làm ({group.items.length} món)
                  </button>
                </div>
              )}
              {status === 'IN_PROGRESS' && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => onUpdate({ itemsToUpdate: group.items, status: 'DONE' })}
                    disabled={isUpdating}
                    className="w-full justify-center text-green-600 bg-green-50 hover:bg-green-100 px-4 py-3 md:py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} /> Hoàn thành ({group.items.length} món)
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {sortedGroups.length === 0 && (
          <div className="text-center text-brand-400 py-10 border-2 border-dashed border-brand-200 rounded-xl">
            Trống
          </div>
        )}
        {remaining > 0 && (
          <Button variant="outline" className="w-full shrink-0" onClick={onLoadMore}>
            Xem thêm {remaining} đơn đã xong
          </Button>
        )}
      </div>
    </div>
  )
}
