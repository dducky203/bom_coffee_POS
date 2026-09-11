import React, { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Eye, EyeOff, KeyRound, Lock, Pencil, Plus, Search, Unlock, Users } from 'lucide-react'
import { useAuthStore } from '../../app/store'
import { userApi } from '../../shared/lib/api'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import { Badge } from '../../shared/components/Badge'
import { Toggle } from '../../shared/components/Toggle'
import { Select } from '../../shared/components/Select'

const PAGE_SIZES = [10, 20, 50]
const inputClass = 'w-full h-11 px-4 rounded-xl border border-brand-200 dark:border-brand-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 text-sm transition-all'

const ROLE_LABELS = {
  ADMIN: 'Quản trị',
  CASHIER: 'Thu ngân',
  WAITER: 'Phục vụ',
  BARTENDER: 'Pha chế',
}

const ROLE_BADGE = {
  ADMIN: 'bg-purple-100 text-purple-800',
  CASHIER: 'bg-teal-100 text-teal-800',
  WAITER: 'bg-sky-100 text-sky-800',
  BARTENDER: 'bg-orange-100 text-orange-800',
}

const emptyForm = {
  username: '',
  password: '',
  fullName: '',
  phone: '',
  roleName: 'WAITER',
  active: true,
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch {
    return '—'
  }
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages = new Set([0, total - 1, current, current - 1, current + 1])
  return [...pages].filter(p => p >= 0 && p < total).sort((a, b) => a - b)
}

export function StaffPage() {
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [form, setForm] = useState(null)
  const [passwordForm, setPasswordForm] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmLock, setConfirmLock] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(timer)
  }, [keywordInput])

  const listParams = useMemo(() => {
    const params = { page, size }
    if (keyword) params.keyword = keyword
    if (roleFilter) params.role = roleFilter
    if (statusFilter === 'active') params.active = true
    if (statusFilter === 'inactive') params.active = false
    return params
  }, [page, size, keyword, roleFilter, statusFilter])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['staffs', listParams],
    queryFn: () => userApi.list(listParams),
    placeholderData: (prev) => prev,
  })

  const { data: statsData } = useQuery({
    queryKey: ['staffs-stats'],
    queryFn: userApi.stats,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: userApi.roles,
  })

  const staffs = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0
  const pages = pageNumbers(page, totalPages)
  const stats = {
    total: statsData?.total ?? 0,
    active: statsData?.active ?? 0,
    locked: statsData?.locked ?? 0,
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['staffs'] })
    queryClient.invalidateQueries({ queryKey: ['staffs-stats'] })
  }

  const saveStaff = useMutation({
    mutationFn: (payload) => form.id
      ? userApi.update(form.id, payload)
      : userApi.create(payload),
    onSuccess: () => { setForm(null); setError(''); setShowPassword(false); invalidate() },
    onError: (err) => setError(err.message),
  })

  const toggleActive = useMutation({
    mutationFn: (id) => userApi.toggleActive(id),
    onSuccess: () => { setConfirmLock(null); invalidate() },
    onError: (err) => setError(err.message),
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }) => userApi.resetPassword(id, newPassword),
    onSuccess: () => { setPasswordForm(null); setError(''); setShowPassword(false) },
    onError: (err) => setError(err.message),
  })

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  const submitStaff = (e) => {
    e.preventDefault()
    setError('')
    if (!form.id && (form.password || '').length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (form.id) {
      saveStaff.mutate({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        roleName: form.roleName,
        active: form.active,
      })
      return
    }
    saveStaff.mutate({
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      roleName: form.roleName,
    })
  }

  const submitPassword = (e) => {
    e.preventDefault()
    setError('')
    if ((passwordForm.newPassword || '').length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    resetPassword.mutate({ id: passwordForm.id, newPassword: passwordForm.newPassword })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quản lý nhân viên</h1>
          <p className="text-brand-500">Tạo tài khoản, phân quyền và khóa / mở khóa nhân viên</p>
        </div>
        <Button onClick={() => {
          setError('')
          setShowPassword(false)
          setForm({ ...emptyForm, roleName: roles.find(r => r.name === 'WAITER')?.name || roles[0]?.name || 'WAITER' })
        }}>
          <Plus size={16} className="mr-2" /> Thêm nhân viên
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Tổng nhân viên" value={stats.total} />
        <StatCard title="Đang hoạt động" value={stats.active} accent="text-green-700" />
        <StatCard title="Đã khóa" value={stats.locked} accent="text-red-600" />
      </div>

      {error && !form && !passwordForm && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border border-brand-200 p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tên, tài khoản, số điện thoại..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} lg:w-48`}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map(role => (
            <option key={role.id} value={role.name}>{roleLabel(role.name)}</option>
          ))}
        </select>
        <select
          className={`${inputClass} lg:w-44`}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã khóa</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-brand-600">
        <p>
          {isFetching && !isLoading ? 'Đang lọc...' : `${totalElements} nhân viên`}
        </p>
        <div className="flex items-center gap-2">
          <span>Mỗi trang</span>
          <select
            className="h-9 px-2 border border-brand-200 rounded-lg bg-white"
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        {isLoading && <p className="p-4 text-brand-500 text-sm">Đang tải...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-brand-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Nhân viên</th>
                <th className="text-left font-medium px-4 py-3">Tài khoản</th>
                <th className="text-left font-medium px-4 py-3">Điện thoại</th>
                <th className="text-left font-medium px-4 py-3">Vai trò</th>
                <th className="text-left font-medium px-4 py-3">Trạng thái</th>
                <th className="text-left font-medium px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {staffs.map(staff => {
                const isSelf = currentUser.id === staff.id
                return (
                  <tr key={staff.id} className="border-t border-brand-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-900">{staff.fullName}</p>
                      {isSelf && <p className="text-xs text-brand-400">Tài khoản của bạn</p>}
                    </td>
                    <td className="px-4 py-3 text-brand-700">{staff.username}</td>
                    <td className="px-4 py-3 text-brand-600">{staff.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[staff.role] || 'bg-gray-100 text-gray-700'}`}>
                        {roleLabel(staff.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={staff.active ? 'success' : 'danger'}>
                        {staff.active ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-500 whitespace-nowrap">{formatDate(staff.createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
                        title="Sửa"
                        onClick={() => {
                          setError('')
                          setShowPassword(false)
                          setForm({
                            id: staff.id,
                            username: staff.username,
                            password: '',
                            fullName: staff.fullName,
                            phone: staff.phone || '',
                            roleName: staff.role,
                            active: staff.active,
                          })
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
                        title="Đặt lại mật khẩu"
                        onClick={() => {
                          setError('')
                          setShowPassword(false)
                          setPasswordForm({ id: staff.id, fullName: staff.fullName, newPassword: '', confirmPassword: '' })
                        }}
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
                        title={isSelf ? 'Không thể khóa tài khoản đang đăng nhập' : (staff.active ? 'Khóa tài khoản' : 'Mở khóa')}
                        disabled={isSelf}
                        onClick={() => {
                          setError('')
                          setConfirmLock(staff)
                        }}
                      >
                        {staff.active ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && staffs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-brand-400">
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Trang {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
            <ChevronLeft size={16} />
          </Button>
          {pages.map((p, index) => {
            const prev = pages[index - 1]
            return (
              <React.Fragment key={p}>
                {prev != null && p - prev > 1 && <span className="px-1 text-brand-400">...</span>}
                <button
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-9 px-2 rounded-lg text-sm border ${
                    p === page ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-brand-200 text-brand-700'
                  }`}
                >
                  {p + 1}
                </button>
              </React.Fragment>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1 || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <Modal isOpen={Boolean(form)} onClose={() => { setForm(null); setError('') }} title={form?.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
        {form && (
          <form onSubmit={submitStaff} className="space-y-3">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="text-sm font-medium">Họ và tên</label>
              <input className={inputClass} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Tên đăng nhập</label>
              <input
                className={`${inputClass} disabled:bg-brand-50 disabled:text-brand-500`}
                required
                disabled={Boolean(form.id)}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              {form.id && <p className="text-xs text-brand-400 mt-1">Không thể đổi tên đăng nhập sau khi tạo</p>}
            </div>
            {!form.id && (
              <div>
                <label className="text-sm font-medium">Mật khẩu</label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-11`}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Số điện thoại</label>
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Vai trò</label>
              <Select
                value={form.roleName}
                onChange={(val) => setForm({ ...form, roleName: val })}
                placeholder="Chọn vai trò..."
                options={roles.map(role => ({
                  value: role.name,
                  label: roleLabel(role.name)
                }))}
              />
            </div>
            {form.id && (
              <div className="pt-1">
                <Toggle
                  checked={form.active}
                  onChange={(checked) => setForm({ ...form, active: checked })}
                  disabled={currentUser.id === form.id}
                  label="Trạng thái tài khoản"
                  description="Cho phép tài khoản này đăng nhập hệ thống POS"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setForm(null); setError('') }}>Hủy</Button>
              <Button type="submit" disabled={saveStaff.isPending}>{saveStaff.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={Boolean(passwordForm)} onClose={() => { setPasswordForm(null); setError('') }} title="Đặt lại mật khẩu">
        {passwordForm && (
          <form onSubmit={submitPassword} className="space-y-3">
            <p className="text-sm text-brand-600">Đặt mật khẩu mới cho <span className="font-semibold">{passwordForm.fullName}</span></p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="text-sm font-medium">Mật khẩu mới</label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Xác nhận mật khẩu</label>
              <input
                className={inputClass}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setPasswordForm(null); setError('') }}>Hủy</Button>
              <Button type="submit" disabled={resetPassword.isPending}>{resetPassword.isPending ? 'Đang lưu...' : 'Đặt lại'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmLock)}
        onClose={() => setConfirmLock(null)}
        onConfirm={() => confirmLock && toggleActive.mutate(confirmLock.id)}
        title={confirmLock?.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={confirmLock?.active
          ? `Khóa tài khoản "${confirmLock?.fullName}"? Nhân viên này sẽ không đăng nhập được.`
          : `Mở khóa tài khoản "${confirmLock?.fullName}"?`}
        confirmText={confirmLock?.active ? 'Khóa' : 'Mở khóa'}
        isDestructive={Boolean(confirmLock?.active)}
        isLoading={toggleActive.isPending}
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
        <Users size={20} />
      </div>
    </div>
  )
}
