import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../app/store'
import { categoryApi, productApi, toppingApi } from '../../shared/lib/api'
import { formatCurrency } from '../../shared/lib/utils'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const inputClass = 'w-full h-11 px-4 rounded-lg border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white'

const emptyProduct = {
  name: '',
  categoryId: '',
  basePrice: '',
  description: '',
  imageUrl: '',
  active: true,
  hasDrinkOptions: true,
}

const emptyCategory = {
  name: '',
  sortOrder: 0,
  active: true,
}

export function MenuPage() {
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [productForm, setProductForm] = useState(null)
  const [categoryForm, setCategoryForm] = useState(null)
  const [toppingForm, setToppingForm] = useState(null)
  const [error, setError] = useState('')

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: () => categoryApi.list(true),
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-admin'],
    queryFn: () => productApi.list(undefined, true),
  })

  const { data: toppings = [] } = useQuery({
    queryKey: ['toppings-admin'],
    queryFn: () => toppingApi.list(true),
  })

  const visibleProducts = useMemo(() => {
    if (categoryFilter === 'ALL') return products
    return products.filter(p => p.category?.id === Number(categoryFilter))
  }, [products, categoryFilter])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-admin'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['products-admin'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['toppings-admin'] })
    queryClient.invalidateQueries({ queryKey: ['toppings'] })
  }

  const saveProduct = useMutation({
    mutationFn: (payload) => productForm.id
      ? productApi.update(productForm.id, payload)
      : productApi.create(payload),
    onSuccess: () => { setProductForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteProduct = useMutation({
    mutationFn: (id) => productApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const saveCategory = useMutation({
    mutationFn: (payload) => categoryForm.id
      ? categoryApi.update(categoryForm.id, payload)
      : categoryApi.create(payload),
    onSuccess: () => { setCategoryForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteCategory = useMutation({
    mutationFn: (id) => categoryApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const saveTopping = useMutation({
    mutationFn: (payload) => toppingForm.id
      ? toppingApi.update(toppingForm.id, payload)
      : toppingApi.create(payload),
    onSuccess: () => { setToppingForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteTopping = useMutation({
    mutationFn: (id) => toppingApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  const submitProduct = (e) => {
    e.preventDefault()
    saveProduct.mutate({
      name: productForm.name.trim(),
      categoryId: Number(productForm.categoryId),
      basePrice: Number(productForm.basePrice),
      description: productForm.description || null,
      imageUrl: productForm.imageUrl || null,
      active: productForm.active,
      hasDrinkOptions: productForm.hasDrinkOptions,
    })
  }

  const submitCategory = (e) => {
    e.preventDefault()
    saveCategory.mutate({
      name: categoryForm.name.trim(),
      sortOrder: Number(categoryForm.sortOrder) || 0,
      active: categoryForm.active,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quản lý món & giá</h1>
          <p className="text-brand-500">Thêm, sửa, ẩn danh mục và món nước</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setError(''); setCategoryForm({ ...emptyCategory }) }}>
            <Plus size={16} className="mr-2" /> Danh mục
          </Button>
          <Button variant="outline" onClick={() => { setError(''); setToppingForm({ name: '', extraPrice: 5000, defaultTopping: false, active: true, sortOrder: 0 }) }}>
            <Plus size={16} className="mr-2" /> Topping
          </Button>
          <Button onClick={() => {
            setError('')
            setProductForm({
              ...emptyProduct,
              categoryId: categoryFilter !== 'ALL' ? categoryFilter : (categories[0]?.id || ''),
            })
          }}>
            <Plus size={16} className="mr-2" /> Món nước
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${categoryFilter === 'ALL' ? 'bg-brand-600 text-white' : 'bg-white border border-brand-200 text-brand-700'}`}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(String(cat.id))}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${String(cat.id) === String(categoryFilter) ? 'bg-brand-600 text-white' : 'bg-white border border-brand-200 text-brand-700'}`}
          >
            {cat.name}{!cat.active ? ' (ẩn)' : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100 font-semibold">Danh mục</div>
          {loadingCats && <p className="p-4 text-brand-500 text-sm">Đang tải...</p>}
          <div className="divide-y divide-brand-100">
            {categories.map(cat => (
              <div key={cat.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-brand-500">Thứ tự {cat.sortOrder} · {cat.active ? 'Hiện' : 'Ẩn'}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg" onClick={() => { setError(''); setCategoryForm({ id: cat.id, name: cat.name, sortOrder: cat.sortOrder, active: cat.active }) }}>
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => { if (confirm(`Ẩn danh mục "${cat.name}"?`)) deleteCategory.mutate(cat.id) }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100 font-semibold">Món nước</div>
          {loadingProducts && <p className="p-4 text-brand-500 text-sm">Đang tải...</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Tên món</th>
                  <th className="text-left font-medium px-4 py-3">Danh mục</th>
                  <th className="text-right font-medium px-4 py-3">Giá</th>
                  <th className="text-left font-medium px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map(product => (
                  <tr key={product.id} className="border-t border-brand-100">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-brand-600">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-800">{formatCurrency(product.basePrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.active ? 'Đang bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg" onClick={() => {
                        setError('')
                        setProductForm({
                          id: product.id,
                          name: product.name,
                          categoryId: product.category?.id || '',
                          basePrice: product.basePrice,
                          description: product.description || '',
                          imageUrl: product.imageUrl || '',
                          active: product.active,
                          hasDrinkOptions: product.hasDrinkOptions !== false,
                        })
                      }}>
                        <Pencil size={16} />
                      </button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => { if (confirm(`Ẩn món "${product.name}"?`)) deleteProduct.mutate(product.id) }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingProducts && visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-brand-400">Chưa có món trong bộ lọc này</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-100 font-semibold">Topping (thêm tiền khi chọn)</div>
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Tên</th>
              <th className="text-right font-medium px-4 py-3">Giá thêm</th>
              <th className="text-left font-medium px-4 py-3">Mặc định</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {toppings.map(topping => (
              <tr key={topping.id} className="border-t border-brand-100">
                <td className="px-4 py-3 font-medium">{topping.name}</td>
                <td className="px-4 py-3 text-right">{Number(topping.extraPrice) > 0 ? formatCurrency(topping.extraPrice) : 'Free'}</td>
                <td className="px-4 py-3">{topping.defaultTopping ? 'Có' : 'Không'}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg" onClick={() => {
                    setError('')
                    setToppingForm({
                      id: topping.id,
                      name: topping.name,
                      extraPrice: topping.extraPrice,
                      defaultTopping: topping.defaultTopping,
                      active: topping.active,
                      sortOrder: topping.sortOrder || 0,
                    })
                  }}>
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => { if (confirm(`Ẩn topping "${topping.name}"?`)) deleteTopping.mutate(topping.id) }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={Boolean(productForm)} onClose={() => setProductForm(null)} title={productForm?.id ? 'Sửa món nước' : 'Thêm món nước'}>
        {productForm && (
          <form onSubmit={submitProduct} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tên món</label>
              <input className={inputClass} required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Danh mục</label>
              <select className={inputClass} required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                <option value="">Chọn danh mục</option>
                {categories.filter(c => c.active || c.id === productForm.categoryId).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Giá (VND)</label>
              <input className={inputClass} type="number" min="0" step="1000" required value={productForm.basePrice} onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <input className={inputClass} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Ảnh (URL)</label>
              <input className={inputClass} value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} />
              Đang bán
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={productForm.hasDrinkOptions} onChange={(e) => setProductForm({ ...productForm, hasDrinkOptions: e.target.checked })} />
              Chọn % đá / % đường khi order
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProductForm(null)}>Hủy</Button>
              <Button type="submit" disabled={saveProduct.isPending}>{saveProduct.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={Boolean(toppingForm)} onClose={() => setToppingForm(null)} title={toppingForm?.id ? 'Sửa topping' : 'Thêm topping'}>
        {toppingForm && (
          <form onSubmit={(e) => {
            e.preventDefault()
            saveTopping.mutate({
              name: toppingForm.name.trim(),
              extraPrice: Number(toppingForm.extraPrice) || 0,
              defaultTopping: toppingForm.defaultTopping,
              active: toppingForm.active,
              sortOrder: Number(toppingForm.sortOrder) || 0,
            })
          }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tên topping</label>
              <input className={inputClass} required value={toppingForm.name} onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Giá thêm (VND) — 0 = miễn phí</label>
              <input className={inputClass} type="number" min="0" step="1000" required value={toppingForm.extraPrice} onChange={(e) => setToppingForm({ ...toppingForm, extraPrice: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={toppingForm.defaultTopping} onChange={(e) => setToppingForm({ ...toppingForm, defaultTopping: e.target.checked })} />
              Chọn sẵn khi order
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={toppingForm.active} onChange={(e) => setToppingForm({ ...toppingForm, active: e.target.checked })} />
              Đang bán
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setToppingForm(null)}>Hủy</Button>
              <Button type="submit" disabled={saveTopping.isPending}>{saveTopping.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={Boolean(categoryForm)} onClose={() => setCategoryForm(null)} title={categoryForm?.id ? 'Sửa danh mục' : 'Thêm danh mục'}>
        {categoryForm && (
          <form onSubmit={submitCategory} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tên danh mục</label>
              <input className={inputClass} required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Thứ tự</label>
              <input className={inputClass} type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={categoryForm.active} onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })} />
              Hiển thị
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCategoryForm(null)}>Hủy</Button>
              <Button type="submit" disabled={saveCategory.isPending}>{saveCategory.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
