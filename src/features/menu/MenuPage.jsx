import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Coffee, ImagePlus, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { Select } from '../../shared/components/Select'
import { Toggle } from '../../shared/components/Toggle'
import { categoryApi, productApi, toppingApi, uploadApi } from '../../shared/lib/api'
import { catalogOptions } from '../../shared/lib/queries'
import { formatCurrency } from '../../shared/lib/utils'

const inputClass = 'w-full h-11 px-4 rounded-xl border border-brand-200 dark:border-brand-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 text-sm transition-all'

const emptyProduct = {
  name: '',
  categoryId: '',
  basePrice: '',
  description: '',
  imageUrl: '',
  originalImageUrl: '',
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
  const [imagePreview, setImagePreview] = useState('')
  const imageInputRef = useRef(null)
  const imageFileRef = useRef(null)
  const previewUrlRef = useRef('')

  const clearLocalImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    imageFileRef.current = null
    setImagePreview('')
  }

  const closeProductForm = () => {
    clearLocalImage()
    setProductForm(null)
  }

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: () => categoryApi.list(true),
    ...catalogOptions,
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-admin'],
    queryFn: () => productApi.list(undefined, true),
    ...catalogOptions,
  })

  const { data: toppings = [] } = useQuery({
    queryKey: ['toppings-admin'],
    queryFn: () => toppingApi.list(true),
    ...catalogOptions,
  })

  const sortedToppings = useMemo(() => {
    return [...toppings].sort((a, b) => (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)) || (Number(a.id) - Number(b.id)))
  }, [toppings])

  const visibleProducts = useMemo(() => {
    if (categoryFilter === 'ALL') return products
    return products.filter(p => p.category?.id === Number(categoryFilter))
  }, [products, categoryFilter])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-admin'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['products-admin'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['toppings-admin'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['toppings'], refetchType: 'all' })
  }

  const saveProduct = useMutation({
    mutationFn: async (payload) => {
      let imageUrl = payload.imageUrl || ''
      if (imageFileRef.current) {
        const uploaded = await uploadApi.image(imageFileRef.current)
        imageUrl = uploaded.url
      }

      // Xóa ảnh cũ trên Cloudinary nếu người dùng gỡ ảnh hoặc thay ảnh mới
      const oldImg = payload.originalImageUrl
      if (oldImg && oldImg !== imageUrl) {
        try {
          await uploadApi.delete(oldImg)
        } catch (err) {
          console.warn('Không thể xóa ảnh trên Cloudinary:', err)
        }
      }

      const body = {
        name: payload.name,
        categoryId: payload.categoryId,
        basePrice: payload.basePrice,
        description: payload.description,
        imageUrl: imageUrl ? imageUrl : '',
        active: payload.active,
        hasDrinkOptions: payload.hasDrinkOptions,
      }
      return payload.id
        ? productApi.update(payload.id, body)
        : productApi.create(body)
    },
    onSuccess: () => { closeProductForm(); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteProduct = useMutation({
    mutationFn: (id) => productApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const saveCategory = useMutation({
    mutationFn: (payload) => {
      const id = payload.id || categoryForm?.id
      const body = {
        name: payload.name,
        sortOrder: Number(payload.sortOrder) || 0,
        active: payload.active,
      }
      return id
        ? categoryApi.update(id, body)
        : categoryApi.create(body)
    },
    onSuccess: () => { setCategoryForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteCategory = useMutation({
    mutationFn: (id) => categoryApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const saveTopping = useMutation({
    mutationFn: (payload) => {
      const id = payload.id || toppingForm?.id
      const body = {
        name: payload.name,
        extraPrice: Number(payload.extraPrice) || 0,
        defaultTopping: payload.defaultTopping,
        active: payload.active,
        sortOrder: Number(payload.sortOrder) || 0,
      }
      return id
        ? toppingApi.update(id, body)
        : toppingApi.create(body)
    },
    onSuccess: () => { setToppingForm(null); setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const deleteTopping = useMutation({
    mutationFn: (id) => toppingApi.remove(id),
    onSuccess: () => { setError(''); invalidate() },
    onError: (err) => setError(err.message),
  })

  const pickProductImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chọn file ảnh (JPG, PNG, WEBP, GIF)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tối đa 5MB')
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const preview = URL.createObjectURL(file)
    previewUrlRef.current = preview
    imageFileRef.current = file
    setImagePreview(preview)
    setError('')
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  const submitProduct = (e) => {
    e.preventDefault()
    saveProduct.mutate({
      id: productForm.id,
      name: productForm.name.trim(),
      categoryId: Number(productForm.categoryId),
      basePrice: Number(productForm.basePrice),
      description: productForm.description || null,
      imageUrl: productForm.imageUrl?.trim() || '',
      originalImageUrl: productForm.originalImageUrl || '',
      active: productForm.active,
      hasDrinkOptions: productForm.hasDrinkOptions,
    })
  }

  const submitCategory = (e) => {
    e.preventDefault()
    saveCategory.mutate({
      id: categoryForm.id,
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
            clearLocalImage()
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
                  <p className="text-xs text-brand-500">
                    Thứ tự {cat.sortOrder} · {cat.active ? 'Hiện' : 'Ẩn'}
                    {String(cat.name || '').trim().toLowerCase() === 'khác' ? ' · Không qua KDS' : ''}
                  </p>
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

        <div className="lg:col-span-2 bg-white dark:bg-brand-900 rounded-2xl border border-brand-200/70 dark:border-brand-800 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-brand-100 dark:border-brand-800 font-bold text-brand-900 dark:text-brand-50 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coffee size={18} className="text-brand-600 dark:text-brand-400" />
              Danh sách Món nước ({visibleProducts.length})
            </span>
          </div>
          {loadingProducts && <p className="p-4 text-brand-500 text-sm">Đang tải danh sách món...</p>}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60 dark:bg-brand-800/60 text-brand-600 dark:text-brand-400 border-b border-brand-100 dark:border-brand-800">
                <tr>
                  <th className="text-left font-bold px-4 py-3">Món nước</th>
                  <th className="text-left font-bold px-4 py-3">Danh mục</th>
                  <th className="text-right font-bold px-4 py-3">Giá bán</th>
                  <th className="text-left font-bold px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-800">
                {visibleProducts.map(product => (
                  <tr key={product.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover border border-brand-200 dark:border-brand-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-500 shrink-0">
                            <Coffee size={20} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-brand-900 dark:text-brand-50">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-brand-500 dark:text-brand-400 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-600 dark:text-brand-400 font-medium">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-brand-900 dark:text-brand-50">
                      {formatCurrency(product.basePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.active
                          ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-brand-800 text-gray-500 dark:text-brand-400'
                        }`}>
                        {product.active ? 'Đang bán' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        className="p-2 text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-xl transition-all mr-1"
                        onClick={() => {
                          setError('')
                          clearLocalImage()
                          setProductForm({
                            id: product.id,
                            name: product.name,
                            categoryId: product.category?.id || '',
                            basePrice: product.basePrice,
                            description: product.description || '',
                            imageUrl: product.imageUrl || '',
                            originalImageUrl: product.imageUrl || '',
                            active: product.active,
                            hasDrinkOptions: product.hasDrinkOptions !== false,
                          })
                        }}
                        title="Sửa món"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                        onClick={() => { if (confirm(`Ẩn món "${product.name}"?`)) deleteProduct.mutate(product.id) }}
                        title="Xóa / Ẩn món"
                      >
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
        <div className="overflow-x-auto">
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
              {sortedToppings.map(topping => (
                <tr key={topping.id} className="border-t border-brand-100">
                  <td className="px-4 py-3 font-medium">{topping.name}</td>
                  <td className="px-4 py-3 text-right">{Number(topping.extraPrice) > 0 ? formatCurrency(topping.extraPrice) : 'Free'}</td>
                  <td className="px-4 py-3">{topping.defaultTopping ? 'Có' : 'Không'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
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
      </div>

      <Modal isOpen={Boolean(productForm)} onClose={closeProductForm} title={productForm?.id ? 'Sửa món nước' : 'Thêm món nước'}>
        {productForm && (
          <form onSubmit={submitProduct} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tên món</label>
              <input className={inputClass} required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Danh mục</label>
              <Select
                value={productForm.categoryId}
                onChange={(val) => setProductForm({ ...productForm, categoryId: val })}
                placeholder="Chọn danh mục..."
                options={categories
                  .filter(c => c.active || c.id === productForm.categoryId)
                  .map(c => ({ value: c.id, label: c.name }))
                }
              />
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
              <label className="text-sm font-medium text-brand-900 dark:text-brand-50 block mb-1.5">Ảnh món</label>
              <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl border border-brand-200/80 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-900/40">
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-brand-100 dark:bg-brand-800 overflow-hidden border border-brand-200/80 dark:border-brand-700 shrink-0 flex items-center justify-center shadow-md relative group">
                  {(imagePreview || productForm.imageUrl) ? (
                    <img src={imagePreview || productForm.imageUrl} alt="Xem trước ảnh món" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center text-brand-400 dark:text-brand-500 space-y-1">
                      <ImagePlus size={32} />
                      <span className="text-[11px] font-medium">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2.5 w-full">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={pickProductImage}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saveProduct.isPending}
                      onClick={() => imageInputRef.current?.click()}
                      className="rounded-xl h-10 px-3.5 text-xs font-semibold"
                    >
                      <Upload size={15} className="mr-1.5" />
                      Chọn ảnh
                    </Button>
                    {(imagePreview || productForm.imageUrl) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          clearLocalImage()
                          setProductForm({ ...productForm, imageUrl: '' })
                        }}
                        className="rounded-xl h-10 px-3.5 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Gỡ ảnh
                      </Button>
                    )}
                  </div>
                  <input
                    className={inputClass}
                    placeholder="Hoặc dán URL ảnh từ web..."
                    value={imagePreview ? '' : productForm.imageUrl}
                    onChange={(e) => {
                      clearLocalImage()
                      setProductForm({ ...productForm, imageUrl: e.target.value })
                    }}
                  />
                  <p className="text-[11px] text-brand-500 dark:text-brand-400">
                    {imagePreview
                      ? 'Bấm "Lưu" để cập nhật.'
                      : 'Hỗ trợ JPG, PNG, WEBP, GIF · Tối đa 5MB.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <Toggle
                checked={productForm.active}
                onChange={(checked) => setProductForm({ ...productForm, active: checked })}
                label="Đang kinh doanh món này"
                description="Cho phép chọn món này trên thực đơn POS"
              />
              <Toggle
                checked={productForm.hasDrinkOptions}
                onChange={(checked) => setProductForm({ ...productForm, hasDrinkOptions: checked })}
                label="Chọn % đá / % đường khi order"
                description="Hiển thị popup chọn mức đá & đường khi nhân viên bấm chọn món"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-brand-100 dark:border-brand-800">
              <Button type="button" variant="outline" onClick={closeProductForm}>Hủy</Button>
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
            <div className="space-y-2 pt-1">
              <Toggle
                checked={toppingForm.defaultTopping}
                onChange={(checked) => setToppingForm({ ...toppingForm, defaultTopping: checked })}
                label="Chọn sẵn mặc định"
                description="Tự động chọn topping này khi mở popup order"
              />
              <Toggle
                checked={toppingForm.active}
                onChange={(checked) => setToppingForm({ ...toppingForm, active: checked })}
                label="Đang bán"
                description="Cho phép khách chọn topping này"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-brand-100 dark:border-brand-800">
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
            <div className="pt-1">
              <Toggle
                checked={categoryForm.active}
                onChange={(checked) => setCategoryForm({ ...categoryForm, active: checked })}
                label="Hiển thị danh mục"
                description="Hiển thị danh mục này trên thanh chọn món"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-brand-100 dark:border-brand-800">
              <Button type="button" variant="outline" onClick={() => setCategoryForm(null)}>Hủy</Button>
              <Button type="submit" disabled={saveCategory.isPending}>{saveCategory.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
