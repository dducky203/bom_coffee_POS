import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kdsApi } from '../../shared/lib/api'
import { audioService } from '../../shared/lib/audioService'
import { useAuthStore } from '../../app/store'
import { Card, CardContent } from '../../shared/components/Card'
import { Badge } from '../../shared/components/Badge'
import { Button } from '../../shared/components/Button'
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Coffee,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const DONE_PAGE_SIZE = 8

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
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'
  const [hideDoneColumn, setHideDoneColumn] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Ticking clock for accurate wait time calculation every 20s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

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

  // Refetch queue every 60 seconds
  const { data: queue = [], isLoading, error } = useQuery({
    queryKey: ['kds-queue', loadAll],
    queryFn: () => kdsApi.queue(loadAll),
    refetchInterval: 60_000,
  })

  const pending = useMemo(() => queue.filter(i => i.status === 'PENDING'), [queue])
  const inProgress = useMemo(() => queue.filter(i => i.status === 'IN_PROGRESS'), [queue])
  const done = useMemo(() => queue.filter(i => i.status === 'DONE'), [queue])
  const pendingGroups = useMemo(() => groupItems(pending, 'PENDING'), [pending])
  const pendingItemCount = useMemo(
    () => pending.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [pending]
  )
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const updateGroupStatus = useMutation({
    mutationFn: ({ itemsToUpdate, status }) =>
      kdsApi.updateStatuses(itemsToUpdate.map(item => item.id), status),
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

  // Periodic reminder voice alert every 2 minutes if pending orders remain unhandled
  useEffect(() => {
    if (!soundEnabled || pending.length === 0) return undefined

    const timer = setInterval(() => {
      if (pendingGroups.length > 0) {
        audioService.remindPending(pendingGroups.length, pendingItemCount)
      }
    }, 2 * 60 * 1000)

    return () => clearInterval(timer)
  }, [pendingGroups, pendingItemCount, soundEnabled])

  // Determine which columns to show based on activeTab and hideDoneColumn
  const showPending = activeTab === 'ALL' || activeTab === 'PENDING'
  const showInProgress = activeTab === 'ALL' || activeTab === 'IN_PROGRESS'
  const showDone = (activeTab === 'ALL' && !hideDoneColumn) || activeTab === 'DONE'

  // Decide if cards should be in multi-column grid inside Column
  const isSingleTab = activeTab !== 'ALL'
  const isFocusedTwoCol = activeTab === 'ALL' && hideDoneColumn

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Coffee size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-900 dark:text-brand-50 tracking-tight">
              KDS - Màn Hình Pha Chế
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
              {pendingGroups.length} đơn · {pendingItemCount} món chờ
            </span>
          </div>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
            {loadAll ? 'Đang xem tất cả đơn' : `Hôm nay, ${format(new Date(), 'dd/MM/yyyy', { locale: vi })}`}
            {soundEnabled ? ' · Giọng Việt tự động đọc đơn' : ' · Âm thanh tắt'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              soundEnabled 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-amber-500/20 scale-[1.02]' 
                : 'bg-white dark:bg-brand-800 text-brand-600 dark:text-brand-300 border-brand-200 dark:border-brand-700 hover:bg-brand-50'
            }`}
            title={soundEnabled ? 'Tắt âm thanh đọc đơn' : 'Bật âm thanh đọc đơn'}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={16} className="animate-pulse" />
                <span>Giọng đọc: Bật</span>
              </>
            ) : (
              <>
                <VolumeX size={16} />
                <span>Giọng đọc: Tắt</span>
              </>
            )}
          </button>

          {/* Desktop Hide/Show Done Column Toggle */}
          <button
            type="button"
            onClick={() => setHideDoneColumn(v => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
              hideDoneColumn
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                : 'bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            title={hideDoneColumn ? 'Mở lại cột Đã xong' : 'Ẩn cột Đã xong để phóng to 2 cột chờ làm & đang làm'}
          >
            {hideDoneColumn ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{hideDoneColumn ? 'Hiện cột Xong' : 'Chỉ đơn cần làm'}</span>
          </button>

          {/* Fullscreen Mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-white dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700 shadow-sm transition-all"
            title={isFullscreen ? 'Thu nhỏ giao diện' : 'Phóng toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>

          {/* Admin Date Switcher */}
          {isAdmin && (
            <div className="flex rounded-xl border border-brand-200 dark:border-brand-700 overflow-hidden bg-white dark:bg-brand-800 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => { setShowAll(false); setDoneLimit(DONE_PAGE_SIZE) }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!showAll ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-700 dark:text-brand-300 hover:bg-brand-50'}`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => { setShowAll(true); setDoneLimit(DONE_PAGE_SIZE) }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${showAll ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-700 dark:text-brand-300 hover:bg-brand-50'}`}
              >
                Tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive View Tabs: Highly accessible on mobile, tablet & desktop */}
      <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-brand-900/80 rounded-xl border border-brand-200/80 dark:border-brand-800 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'ALL'
              ? 'bg-brand-800 text-white shadow-sm'
              : 'text-brand-600 dark:text-brand-400 hover:bg-brand-100/60 dark:hover:bg-brand-800'
          }`}
        >
          <span>Tất cả các cột</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          <span>Chờ làm</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'PENDING' ? 'bg-white text-amber-700' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800'}`}>
            {groupItems(pending, 'PENDING').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
          }`}
        >
          <span>Đang làm</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'IN_PROGRESS' ? 'bg-white text-blue-700' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800'}`}>
            {groupItems(inProgress, 'IN_PROGRESS').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DONE')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'DONE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          <span>Đã xong</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'DONE' ? 'bg-white text-emerald-700' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800'}`}>
            {groupItems(done, 'DONE').length}
          </span>
        </button>
      </div>

      {isLoading && <p className="text-brand-500 font-medium">Đang tải danh sách hàng đợi...</p>}
      {error && <p className="text-red-600 font-medium">{error.message}</p>}

      {/* Main Responsive Columns Container */}
      <div className={`flex-1 min-h-0 ${
        isSingleTab
          ? 'flex flex-col min-h-0'
          : hideDoneColumn
            ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5 min-h-0'
            : 'flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-3.5 pb-2 md:pb-0 min-h-0'
      }`}>
        {showPending && (
          <div className={!isSingleTab && activeTab === 'ALL' ? 'min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center flex-1 h-full min-h-0 flex flex-col' : 'flex-1 h-full min-h-0 flex flex-col'}>
            <Column
              title="Chờ làm"
              status="PENDING"
              items={pending}
              icon={Clock}
              colorClass="text-amber-500"
              badgeBg="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
              onUpdate={updateGroupStatus.mutate}
              isUpdating={updateGroupStatus.isPending}
              now={now}
              isSingleTab={isSingleTab}
            />
          </div>
        )}

        {showInProgress && (
          <div className={!isSingleTab && activeTab === 'ALL' ? 'min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center flex-1 h-full min-h-0 flex flex-col' : 'flex-1 h-full min-h-0 flex flex-col'}>
            <Column
              title="Đang làm"
              status="IN_PROGRESS"
              items={inProgress}
              icon={PlayCircle}
              colorClass="text-blue-500"
              badgeBg="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
              onUpdate={updateGroupStatus.mutate}
              isUpdating={updateGroupStatus.isPending}
              now={now}
              isSingleTab={isSingleTab}
            />
          </div>
        )}

        {showDone && (
          <div className={!isSingleTab && activeTab === 'ALL' ? 'min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center flex-1 h-full min-h-0 flex flex-col' : 'flex-1 h-full min-h-0 flex flex-col'}>
            <Column
              title="Đã xong"
              status="DONE"
              items={done}
              icon={CheckCircle2}
              colorClass="text-emerald-500"
              badgeBg="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
              visibleLimit={doneLimit}
              onLoadMore={() => setDoneLimit(n => n + DONE_PAGE_SIZE)}
              now={now}
              isSingleTab={isSingleTab}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Column({ 
  title, 
  status, 
  items, 
  icon: Icon, 
  colorClass, 
  badgeBg,
  onUpdate, 
  isUpdating, 
  visibleLimit, 
  onLoadMore,
  now,
  isSingleTab = false
}) {
  const sortedGroups = useMemo(() => groupItems(items, status), [items, status])
  const visibleGroups = visibleLimit ? sortedGroups.slice(0, visibleLimit) : sortedGroups
  const remaining = visibleLimit ? Math.max(sortedGroups.length - visibleLimit, 0) : 0

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-brand-50/70 dark:bg-brand-900/60 rounded-2xl p-3 sm:p-4 h-full min-w-0 border border-brand-200/80 dark:border-brand-800 shadow-sm overflow-hidden">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-brand-200/60 dark:border-brand-800">
        <h2 className="font-extrabold text-base sm:text-lg text-brand-900 dark:text-brand-50 flex items-center gap-2">
          <Icon className={colorClass} size={22} />
          <span>{title}</span>
        </h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${badgeBg || 'bg-white'}`}>
          {sortedGroups.length} đơn
        </span>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {visibleGroups.length > 0 ? (
          <div className={
            isSingleTab 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5' 
              : 'flex flex-col gap-3'
          }>
            {visibleGroups.map((group, idx) => {
              const waitMinutes = Math.max(0, Math.floor((now - group.time) / 60000))
              const isUrgent = status !== 'DONE' && waitMinutes >= 10
              const isWarning = status !== 'DONE' && waitMinutes >= 5 && waitMinutes < 10

              return (
                <Card 
                  key={`${group.tableName}-${group.time}-${idx}`} 
                  className={`rounded-2xl transition-all duration-200 border-2 overflow-hidden shadow-sm hover:shadow-md shrink-0 ${
                    isUrgent
                      ? 'border-red-400 dark:border-red-600 bg-red-50/20 dark:bg-red-950/20'
                      : isWarning
                        ? 'border-amber-300 dark:border-amber-600/70 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-brand-200/80 dark:border-brand-700 bg-white dark:bg-brand-850'
                  }`}
                >
                  <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    {/* Card Header: Table Name & Time Alert */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-100 dark:border-brand-800">
                        <div className="min-w-0 flex items-baseline gap-2">
                          <span className="font-black text-xl sm:text-2xl text-brand-900 dark:text-brand-50 tracking-tight whitespace-nowrap">
                            {group.tableName}
                          </span>
                          {group.customerName && (
                            <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 truncate">
                              · {group.customerName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-300">
                            <Clock size={13} />
                            <span>{format(new Date(group.time), 'HH:mm')}</span>
                          </div>
                          {status !== 'DONE' && (
                            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isUrgent 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : isWarning 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-300' 
                                  : 'bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300'
                            }`}>
                              {waitMinutes === 0 ? 'Mới' : `${waitMinutes}p`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 mb-3">
                        {group.items.map(item => (
                          <div 
                            key={item.id} 
                            className="p-2.5 rounded-xl bg-brand-50/60 dark:bg-brand-900/50 border border-brand-100/80 dark:border-brand-800 flex flex-col"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-base text-brand-700 dark:text-brand-300 shrink-0 pt-0.5">
                                {item.quantity}x
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-base text-brand-900 dark:text-brand-50 leading-snug">
                                  {item.product?.name}
                                </span>
                              </div>
                            </div>
                            {item.note && (
                              <div className="mt-1.5 flex items-start gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/80">
                                <span>⚠️ Lưu ý:</span>
                                <span>{item.note}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button: Giant touch target for easy tapping */}
                    {status === 'PENDING' && (
                      <div className="pt-1 mt-auto">
                        <button
                          type="button"
                          onClick={() => onUpdate({ itemsToUpdate: group.items, status: 'IN_PROGRESS' })}
                          disabled={isUpdating}
                          className="w-full h-12 justify-center text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-98 rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                          <PlayCircle size={20} />
                          <span>Bắt đầu làm ({group.items.length} món)</span>
                        </button>
                      </div>
                    )}

                    {status === 'IN_PROGRESS' && (
                      <div className="pt-1 mt-auto">
                        <button
                          type="button"
                          onClick={() => onUpdate({ itemsToUpdate: group.items, status: 'DONE' })}
                          disabled={isUpdating}
                          className="w-full h-12 justify-center text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-98 rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 size={20} />
                          <span>Hoàn thành ({group.items.length} món)</span>
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-brand-400 py-12 border-2 border-dashed border-brand-200/80 dark:border-brand-800 rounded-2xl">
            <Sparkles size={28} className="opacity-40 mb-2" />
            <p className="font-semibold text-sm">Không có đơn nào trong mục này</p>
          </div>
        )}

        {remaining > 0 && (
          <div className="pt-3">
            <Button variant="outline" className="w-full font-bold" onClick={onLoadMore}>
              Xem thêm {remaining} đơn đã xong
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
