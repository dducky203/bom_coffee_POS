import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Coffee, LayoutGrid, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../app/store'
import { tableApi } from '../../shared/lib/api'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import { Badge } from '../../shared/components/Badge'
import { Toggle } from '../../shared/components/Toggle'
import { Select } from '../../shared/components/Select'

const inputClass = 'w-full h-11 px-4 rounded-xl border border-brand-200 dark:border-brand-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 text-sm transition-all'

const TYPE_OPTIONS = [
  { value: 'DRINK', label: 'Bàn nước' },
  { value: 'BILLIARD', label: 'Bàn bi-a' },
]

const TYPE_LABEL = {
  DRINK: 'Bàn nước',
  BILLIARD: 'Bàn bi-a',
}

const STATUS_LABEL = {
  EMPTY: 'Trống',
  SERVING: 'Đang phục vụ',
  RESERVED: 'Đặt trước',
}

const emptyForm = {
  name: '',
  type: 'DRINK',
  zoneId: '',
  capacity: 4,
  active: true,
}

export function TablesAdminPage() {
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(null)
  const [confirmHide, setConfirmHide] = useState(null)
  const [error, setError] = useState('')

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables-admin'],
    queryFn: () => tableApi.list(true),
  })

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: tableApi.zones,
  })

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return tables.filter(table => {
      const matchKeyword = !q
        || table.name?.toLowerCase().includes(q)
        || table.zone?.name?.toLowerCase().includes(q)
      const matchType = !typeFilter || table.type === typeFilter
      const matchStatus = statusFilter === 'active' ? table.active !== false
        : statusFilter === 'inactive' ? table.active === false
        : true
      return matchKeyword && matchType && matchStatus
    })
  }, [tables, keyword, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: tables.length,
    active: tables.filter(t => t.active !== false).length,
    hidden: tables.filter(t => t.active === false).length,
    serving: tables.filter(t => t.status === 'SERVING').length,
  }), [tables])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tables-admin'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  }

  const saveTable = useMutation({
    mutationFn: (payload) => form.id
      ? tableApi.update(form.id, payload)
      : tableApi.create(payload),
    onSuccess: () => { setForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const hideTable = useMutation({
    mutationFn: (id) => tableApi.remove(id),
    onSuccess: () => { setConfirmHide(null); invalidate() },
    onError: (err) => setError(err.message),
  })

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  const openCreate = () => {
    setError('')
    setForm({
      ...emptyForm,
      zoneId: zones[0]?.id ? String(zones[0].id) : '',
    })
  }

  const openEdit = (table) => {
    setError('')
    setForm({
      id: table.id,
      name: table.name || '',
      type: table.type || 'DRINK',
      zoneId: table.zone?.id ? String(table.zone.id) : '',
      capacity: table.capacity ?? 0,
      active: table.active !== false,
    })
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Tên bàn không được để trống')
      return
    }
    saveTable.mutate({
      name: form.name.trim(),
      type: form.type,
      zoneId: form.zoneId ? Number(form.zoneId) : null,
      capacity: Number(form.capacity) || 0,
      active: form.active,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quản lý bàn</h1>
          <p className="text-brand-500">Thêm, sửa, ẩn bàn nước / bi-a và bàn mang về</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Thêm bàn
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng bàn" value={stats.total} />
        <StatCard title="Đang hiện" value={stats.active} accent="text-green-700" />
        <StatCard title="Đã ẩn" value={stats.hidden} accent="text-brand-500" />
        <StatCard title="Đang phục vụ" value={stats.serving} accent="text-amber-700" />
      </div>

      {error && !form && !confirmHide && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border border-brand-200 p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tên bàn, khu vực..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <select className={`${inputClass} lg:w-44`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tất cả loại</option>
          {TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select className={`${inputClass} lg:w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hiện</option>
          <option value="inactive">Đã ẩn</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        {isLoading && <p className="p-4 text-brand-500 text-sm">Đang tải...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-brand-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Tên bàn</th>
                <th className="text-left font-medium px-4 py-3">Loại</th>
                <th className="text-left font-medium px-4 py-3">Khu vực</th>
                <th className="text-left font-medium px-4 py-3">Sức chứa</th>
                <th className="text-left font-medium px-4 py-3">Trạng thái sàn</th>
                <th className="text-left font-medium px-4 py-3">Hiển thị</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(table => (
                <tr key={table.id} className="border-t border-brand-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-900">{table.name}</p>
                    {table.name?.trim().toLowerCase() === 'mang về' && (
                      <p className="text-xs text-emerald-600">Order mang về</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-brand-700">
                      {table.type === 'BILLIARD' ? (
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-white text-[10px] font-bold text-center leading-4">8</span>
                      ) : (
                        <Coffee size={14} className="text-brand-500" />
                      )}
                      {TYPE_LABEL[table.type] || table.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-600">{table.zone?.name || '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{table.capacity ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={table.status === 'SERVING' ? 'warning' : table.status === 'RESERVED' ? 'warning' : 'default'}>
                      {STATUS_LABEL[table.status] || table.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={table.active !== false ? 'success' : 'danger'}>
                      {table.active !== false ? 'Đang hiện' : 'Đã ẩn'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
                      title="Sửa"
                      onClick={() => openEdit(table)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                      title="Ẩn bàn"
                      disabled={table.active === false || table.status === 'SERVING'}
                      onClick={() => {
                        setError('')
                        setConfirmHide(table)
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-brand-400">
                    Không tìm thấy bàn phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={Boolean(form)} onClose={() => { setForm(null); setError('') }} title={form?.id ? 'Sửa bàn' : 'Thêm bàn'}>
        {form && (
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="text-sm font-medium">Tên bàn</label>
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Bàn 8, Mang về, Bida 4"
              />
              <p className="text-xs text-brand-400 mt-1">Đặt tên đúng <strong>Mang về</strong> để dùng thẻ order mang về trên sơ đồ.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Loại bàn</label>
              <Select
                value={form.type}
                onChange={(val) => setForm({ ...form, type: val })}
                options={TYPE_OPTIONS}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Khu vực</label>
              <select
                className={inputClass}
                value={form.zoneId}
                onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              >
                <option value="">Không chọn</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Sức chứa (số chỗ)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            {form.id && (
              <div className="pt-1">
                <Toggle
                  checked={form.active}
                  onChange={(checked) => setForm({ ...form, active: checked })}
                  label="Hiển thị trên sơ đồ bàn"
                  description="Tắt để ẩn bàn khỏi sơ đồ / order (không xóa dữ liệu lịch sử)"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setForm(null); setError('') }}>Hủy</Button>
              <Button type="submit" disabled={saveTable.isPending}>
                {saveTable.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmHide)}
        onClose={() => setConfirmHide(null)}
        onConfirm={() => confirmHide && hideTable.mutate(confirmHide.id)}
        title="Ẩn bàn"
        message={`Ẩn bàn "${confirmHide?.name}" khỏi sơ đồ? Lịch sử đơn cũ vẫn giữ nguyên.`}
        confirmText="Ẩn bàn"
        isDestructive
        isLoading={hideTable.isPending}
      />
    </div>
  )
}

function StatCard({ title, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-brand-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-brand-500">{title}</p>
        <p className={`text-2xl font-bold ${accent || 'text-brand-900'}`}>{value}</p>
      </div>
      <div className="p-3 bg-brand-100 rounded-lg text-brand-600">
        <LayoutGrid size={20} />
      </div>
    </div>
  )
}
