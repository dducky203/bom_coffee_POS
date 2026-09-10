import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../app/store'
import { billiardPricingApi } from '../../shared/lib/api'
import { tablesQuery } from '../../shared/lib/queries'
import { formatCurrency } from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { Select } from '../../shared/components/Select'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const inputClass = 'w-full h-11 px-4 rounded-xl border border-brand-200 dark:border-brand-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 text-sm transition-all'

const emptyForm = {
  tableId: '',
  dayType: 'WEEKDAY',
  startTime: '07:00',
  endTime: '23:59',
  pricePerHour: 60000,
}

function toTimeInput(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function BilliardPricingPage() {
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['billiard-pricing'],
    queryFn: billiardPricingApi.list,
  })

  const { data: tables = [] } = useQuery(tablesQuery)

  const billiardTables = tables.filter(t => t.type === 'BILLIARD')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['billiard-pricing'] })

  const save = useMutation({
    mutationFn: (payload) => form.id
      ? billiardPricingApi.update(form.id, payload)
      : billiardPricingApi.create(payload),
    onSuccess: () => { setForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const remove = useMutation({
    mutationFn: (id) => billiardPricingApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  const submit = (e) => {
    e.preventDefault()
    save.mutate({
      tableId: form.tableId ? Number(form.tableId) : null,
      dayType: form.dayType,
      startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
      endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
      pricePerHour: Number(form.pricePerHour),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Giá bi-a theo giờ</h1>
          <p className="text-brand-500">Cấu hình giá ngày thường / cuối tuần, theo bàn hoặc áp dụng chung</p>
        </div>
        <Button onClick={() => { setError(''); setForm({ ...emptyForm }) }}>
          <Plus size={16} className="mr-2" /> Thêm mức giá
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {isLoading && <p className="text-brand-500">Đang tải bảng giá...</p>}

      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Bàn</th>
              <th className="text-left font-medium px-4 py-3">Loại ngày</th>
              <th className="text-left font-medium px-4 py-3">Khung giờ</th>
              <th className="text-right font-medium px-4 py-3">Giá / giờ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {prices.map(item => (
              <tr key={item.id} className="border-t border-brand-100">
                <td className="px-4 py-3">{item.table?.name || 'Tất cả bàn'}</td>
                <td className="px-4 py-3">{item.dayType === 'WEEKEND' ? 'Cuối tuần' : 'Ngày thường'}</td>
                <td className="px-4 py-3 font-mono">{toTimeInput(item.startTime)} - {toTimeInput(item.endTime)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.pricePerHour)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg" onClick={() => {
                    setError('')
                    setForm({
                      id: item.id,
                      tableId: item.table?.id || '',
                      dayType: item.dayType,
                      startTime: toTimeInput(item.startTime),
                      endTime: toTimeInput(item.endTime),
                      pricePerHour: item.pricePerHour,
                    })
                  }}>
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => { if (confirm('Xóa mức giá này?')) remove.mutate(item.id) }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && prices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-400">Chưa có mức giá nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Sửa giá bi-a' : 'Thêm giá bi-a'}>
        {form && (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Áp dụng cho bàn</label>
              <Select
                value={form.tableId}
                onChange={(val) => setForm({ ...form, tableId: val })}
                placeholder="Tất cả bàn bi-a"
                options={[
                  { value: '', label: 'Tất cả bàn bi-a' },
                  ...billiardTables.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Loại ngày</label>
              <Select
                value={form.dayType}
                onChange={(val) => setForm({ ...form, dayType: val })}
                placeholder="Chọn loại ngày..."
                options={[
                  { value: 'WEEKDAY', label: 'Ngày thường' },
                  { value: 'WEEKEND', label: 'Cuối tuần' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Từ</label>
                <input className={inputClass} type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Đến</label>
                <input className={inputClass} type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Giá / giờ (VND)</label>
              <input className={inputClass} type="number" min="1000" step="1000" required value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>Hủy</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
