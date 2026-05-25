import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Eye, EyeOff, ImagePlus, LayoutDashboard, LogOut, Menu, PackagePlus, Receipt, RotateCcw, Save, Settings2, ShoppingBag, Store, Trash2, TrendingUp, UserCircle2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Carousel from '../components/Carousel'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import SectionLoader from '../components/SectionLoader'
import { orderAPI, productAPI, vendorAPI } from '../utils/api'
import { useCreateProductMutation, useDeleteProductMutation, useUpdateProductMutation, useUploadProductMediaMutation } from '../redux/slices/productApiSlice'
import { useGetCategoriesQuery } from '../redux/slices/categoryApiSlice'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Store Profile', icon: UserCircle2 },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'orders', label: 'Orders', icon: Receipt },
]

const fallbackProductCategories = ['hoodies', 'tshirts', 'caps', 'jackets', 'accessories']
const cx = (...classes) => classes.filter(Boolean).join(' ')
const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
const humanizeStatus = (status) => (status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export default function VendorAdmin() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user, isAuthenticated, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ brandName: '', brandDescription: '', phone: '', bankName: '', accountHolderName: '', accountNumber: '' })
  const [profileFile, setProfileFile] = useState(null)
  const [profileFilePreview, setProfileFilePreview] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [vendorStats, setVendorStats] = useState({ totalRevenue: 0, totalOrders: 0, deliveredCount: 0, commission: 0 })
  const [editingProductId, setEditingProductId] = useState(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', stock: '' })
  const [productFiles, setProductFiles] = useState([])
  const [productFilePreviews, setProductFilePreviews] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
  const fileInputRef = useRef(null)
  const [createProduct, { isLoading: creatingProduct }] = useCreateProductMutation()
  const [updateProduct, { isLoading: updatingProduct }] = useUpdateProductMutation()
  const [uploadProductMedia, { isLoading: uploadingMedia }] = useUploadProductMediaMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const { data: categoriesData = [] } = useGetCategoriesQuery()
  const categoryOptions = useMemo(
    () => Array.isArray(categoriesData) && categoriesData.length > 0 ? categoriesData.map((category) => category.name) : fallbackProductCategories,
    [categoriesData],
  )

  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const softClass = isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') navigate('/auth')
  }, [isAuthenticated, navigate, user])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') return

    const loadData = async () => {
      try {
        setLoading(true)
        const [profileRes, productsRes, ordersRes, statsRes] = await Promise.all([
          vendorAPI.getProfile(),
          productAPI.getVendorProducts(),
          orderAPI.getVendorOrders(),
          vendorAPI.getStats(),
        ])
        const vendorData = profileRes.vendor || {}
        setProfile(vendorData)
        setProducts(productsRes.products || [])
        setOrders(ordersRes.orders || [])
        setVendorStats(statsRes.data?.stats || statsRes.stats || { totalRevenue: 0, totalOrders: 0, deliveredCount: 0, commission: 0 })
        setProfileForm({
          brandName: vendorData.brandName || '',
          brandDescription: vendorData.brandDescription || '',
          phone: vendorData.phone || '',
          bankName: vendorData.bankName || '',
          accountHolderName: vendorData.accountHolderName || '',
          accountNumber: vendorData.accountNumber || '',
        })
        setProfileFilePreview(vendorData.storeImage || null)
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to load vendor data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, user?.role])

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')
    const pendingOrders = orders.filter((order) => order.status === 'pending').length
    return [
      { label: 'Products live', value: products.length },
      { label: 'Paid orders', value: vendorStats.totalOrders || paidOrders.length },
      { label: 'Total revenue', value: formatCurrency(vendorStats.totalRevenue || 0) },
      { label: 'Pending', value: pendingOrders },
    ]
  }, [orders, products, vendorStats])

  const getVendorOrderItems = (order) => {
    const vendorId = user?._id || user?.id
    if (!order?.items || !vendorId) return order.items || []
    return order.items.filter((item) => {
      const itemVendor = item.vendor?._id || item.vendor
      return String(itemVendor) === String(vendorId)
    })
  }

  const showTimedSuccess = (message) => {
    setSuccess(message)
    window.setTimeout(() => setSuccess(null), 3000)
  }

  const resetProductForm = () => {
    setEditingProductId(null)
    setProductForm({ name: '', description: '', price: '', category: '', stock: '' })
    setProductFiles([])
    setProductFilePreviews([])
  }

  const handleProfileFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please upload a valid image file')
    setProfileFile(file)
    setProfileFilePreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      const response = await vendorAPI.updateProfile(profileForm)
      let updatedProfile = response.vendor || {}
      if (profileFile) {
        const uploadResult = await vendorAPI.uploadProfilePicture(profileFile)
        updatedProfile = uploadResult.vendor || { ...updatedProfile, storeImage: uploadResult.url }
      }
      setProfile(updatedProfile)
      setProfileFile(null)
      setProfileEditing(false)
      showTimedSuccess('Store profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length !== files.length) return setError('Please upload only image files')
    if (imageFiles.some((file) => file.size > 10 * 1024 * 1024)) return setError('Each image must be less than 10MB')
    if (imageFiles.length > 4) return setError('You can upload up to 4 images per product')

    const existingImageCount = editingProductId
      ? products.find((product) => product._id === editingProductId)?.images?.length || 0
      : 0

    if (existingImageCount + imageFiles.length > 4) {
      return setError('You can only have up to 4 images per product')
    }

    setProductFiles(imageFiles)
    setProductFilePreviews(imageFiles.map((file) => URL.createObjectURL(file)))
  }

  const handleStartEditProduct = (product) => {
    setEditingProductId(product._id)
    setProductForm({ name: product.name || '', description: product.description || '', price: product.price || '', category: product.category || '', stock: product.stock || '' })
    setProductFiles([])
    setProductFilePreviews(product.images?.length > 0 ? product.images.map((image) => image.url) : [product.videos?.[0]?.url].filter(Boolean))
    setActiveTab('products')
  }

  const handleSaveProduct = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) }
      const isEditing = Boolean(editingProductId && editingProductId !== 'new')
      let resultProduct = isEditing
        ? (await updateProduct({ id: editingProductId, ...payload }).unwrap()).product
        : (await createProduct(payload).unwrap()).product

      if (productFiles.length && resultProduct?._id) {
        const uploadResult = await uploadProductMedia({ productId: resultProduct._id, files: productFiles }).unwrap()
        resultProduct = uploadResult.product || resultProduct
      }

      setProducts((current) => isEditing ? current.map((product) => product._id === resultProduct._id ? resultProduct : product) : [resultProduct, ...current])
      resetProductForm()
      showTimedSuccess(isEditing ? 'Product updated successfully.' : 'Product added successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const closeConfirmDialog = () => setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })

  const confirmDeleteProduct = (productId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete product',
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setConfirmDialog((current) => ({ ...current, loading: true }))
        try {
          setSubmitting(true)
          await productAPI.delete(productId)
          setProducts((current) => current.filter((product) => product._id !== productId))
          showTimedSuccess('Product deleted successfully.')
        } catch (err) {
          setError(err.message || 'Failed to delete product')
        } finally {
          setSubmitting(false)
          closeConfirmDialog()
        }
      },
    })
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setSubmitting(true)
      await orderAPI.updateStatus(orderId, newStatus)
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, status: newStatus } : order))
      showTimedSuccess('Order status updated.')
    } catch (err) {
      setError(err.message || 'Failed to update order')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'vendor') return null

  if (loading) {
    return (
      <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
        <SectionLoader message="Loading vendor dashboard..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className={cx('min-h-screen lg:grid lg:grid-cols-[17rem_1fr]', pageClass)}>
      <aside className={cx('fixed inset-y-0 left-0 z-40 w-72 border-r p-4 transition lg:static lg:block lg:w-auto', mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase text-violet-700">CampusThread</h1>
            <p className={cx('text-xs font-bold uppercase', mutedText)}>Vendor studio</p>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="mt-8 grid gap-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id)
                setMobileMenuOpen(false)
              }}
              className={cx('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition', activeTab === id ? 'bg-violet-700 text-white' : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100')}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={async () => { await logout(); navigate('/auth') }} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
          <LogOut size={16} />
          Log out
        </button>
      </aside>

      <div>
        <header className={cx('sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
          <div className="flex items-center gap-3">
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden" onClick={() => setMobileMenuOpen(true)}><Menu size={18} /></button>
            <div>
              <h2 className="text-2xl font-black tracking-normal">Welcome back, {profile?.brandName || user?.name || 'Vendor'}</h2>
              <p className={cx('text-sm', mutedText)}>Track performance, upload products, and manage buyer orders.</p>
            </div>
            <button type="button" onClick={() => setActiveTab('profile')} className={cx('ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg', isDark ? 'bg-slate-800' : 'bg-slate-100')}><Settings2 size={18} /></button>
          </div>
        </header>

        <div className={cx('border-b px-4 py-3 sm:px-6 lg:px-8', isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
          <div className="flex flex-wrap gap-2">
            {[
              { path: '/', label: 'Home' },
              { path: '/shop', label: 'Shop' },
              { path: '/explore', label: 'Explore' },
              { path: '/cart', label: 'Cart' },
              { path: '/favorites', label: 'Favorites' },
            ].map((link) => (
              <Link key={link.path} to={link.path} className={cx('rounded-full border px-3 py-2 text-sm font-semibold transition', isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100')}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          {profile?.vendorStatus && profile.vendorStatus !== 'approved' && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {profile.vendorStatus === 'pending' ? (
                <>Your vendor account is still pending approval. Products uploaded here will appear on Shop and Explore once your store is approved.</>
              ) : (
                <>Your vendor account was rejected. Update your store profile and contact support for reactivation.</>
              )}
              {profile.vendorRejectedAt && profile.vendorRejectionReason && (
                <p className="mt-2 text-xs text-amber-700">Reason: {profile.vendorRejectionReason}</p>
              )}
            </div>
          )}
          {(error || success) && (
            <div className="mb-5 grid gap-3">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
              {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}
            </div>
          )}

          {loading ? (
            <div className={cx('h-80 animate-pulse rounded-2xl border', surfaceClass)} />
          ) : (
            <>
              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className={cx('rounded-2xl border p-5 text-left shadow-lg', surfaceClass)}>
                    <p className="text-xs font-black uppercase tracking-wide text-violet-700">{stat.label}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-normal">{stat.value}</h3>
                    {stat.detail && <p className={cx('mt-1 text-sm', mutedText)}>{stat.detail}</p>}
                  </div>
                ))}
              </section>

              {activeTab === 'dashboard' && (
                <>
                  <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Panel title="Store Revenue" surfaceClass={surfaceClass}>
                      <div className="space-y-3">
                        <p className={cx('text-sm font-semibold uppercase tracking-[0.2em] text-violet-700')}>Total revenue</p>
                        <p className="text-4xl font-black tracking-tight">{formatCurrency(vendorStats.totalRevenue)}</p>
                        <p className={cx('text-sm', mutedText)}>Revenue from paid orders for your store.</p>
                      </div>
                    </Panel>
                    <Panel title="Platform Commission" surfaceClass={surfaceClass}>
                      <div className="space-y-3">
                        <p className={cx('text-sm font-semibold uppercase tracking-[0.2em] text-violet-700')}>Commission earned</p>
                        <p className="text-4xl font-black tracking-tight">{formatCurrency(vendorStats.commission)}</p>
                        <p className={cx('text-sm', mutedText)}>Estimated platform commission on your paid orders.</p>
                      </div>
                    </Panel>
                    <Panel title="Paid Orders" surfaceClass={surfaceClass}>
                      <div className="space-y-3">
                        <p className={cx('text-sm font-semibold uppercase tracking-[0.2em] text-violet-700')}>Paid orders</p>
                        <p className="text-4xl font-black tracking-tight">{vendorStats.totalOrders}</p>
                        <p className={cx('text-sm', mutedText)}>Orders with completed payment.</p>
                      </div>
                    </Panel>
                  </section>
                  <section className="grid gap-6 xl:grid-cols-2">
                    <Panel title="Recent Products" surfaceClass={surfaceClass}>
                      <List products={products.slice(0, 5)} empty="No products yet." render={(product) => (
                        <button key={product._id} type="button" onClick={() => handleStartEditProduct(product)} className={cx('flex w-full items-center justify-between rounded-xl border p-4 text-left', softClass)}>
                          <span><strong>{product.name}</strong><small className={cx('block', mutedText)}>{formatCurrency(product.price)} / {product.stock} in stock</small></span>
                          <Box size={18} />
                        </button>
                      )} />
                    </Panel>
                    <Panel title="Recent Vendor Orders" surfaceClass={surfaceClass}>
                      <List products={orders.slice(0, 5)} empty="No orders yet." render={(order) => {
                        const vendorItems = getVendorOrderItems(order)
                        const displayAmount = vendorItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)

                        return (
                          <div key={order._id} className={cx('rounded-3xl border p-4', softClass)}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-bold">#{order._id.slice(-6).toUpperCase()}</p>
                                <p className={cx('mt-1 text-xs', mutedText)}>{order.buyer?.name || 'Unknown buyer'}</p>
                                <p className={cx('text-xs', mutedText)}>{order.buyer?.email || 'No email'}</p>
                                <p className={cx('text-xs', mutedText)}>{order.buyer?.phone || 'No phone'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-violet-700">{formatCurrency(displayAmount)}</p>
                                <p className={cx('text-xs', mutedText)}>{vendorItems.length} item(s)</p>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                              <div>
                                <span className="font-semibold">Ordered products:</span>
                                <div className="mt-2 space-y-1">
                                  {vendorItems.length > 0 ? vendorItems.map((item, idx) => (
                                    <div key={`${item.product || item.name}-${idx}`}>{item.name} ×{item.quantity}</div>
                                  )) : <div>No vendor item details available</div>}
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold">Shipping:</span> {order.shippingAddress?.address || 'No address'}, {order.shippingAddress?.city || ''} {order.shippingAddress?.state || ''}
                              </div>
                            </div>
                          </div>
                        )
                      }} />
                    </Panel>
                  </section>
                </>
              )}

              {activeTab === 'profile' && (
                <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                  <Panel title="Store Identity" surfaceClass={surfaceClass}>
                    <div className={cx('mb-5 flex h-48 items-center justify-center overflow-hidden rounded-xl border', softClass)}>
                      {profileFilePreview || profile?.storeImage ? <img src={profileFilePreview || profile?.storeImage} alt={profile?.brandName || 'Store'} className="h-full w-full object-cover" /> : <Store size={44} className={mutedText} />}
                    </div>
                    <h3 className="text-2xl font-black">{profile?.brandName || 'Your store name'}</h3>
                    <p className={cx('mt-2 leading-7', mutedText)}>{profile?.brandDescription || 'Tell buyers what your brand is about.'}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className={cx('rounded-2xl border p-4', softClass)}>
                        <p className={cx('text-xs font-black uppercase tracking-wide', mutedText)}>Bank</p>
                        <p className="mt-2 font-semibold">{profile?.bankName || 'Not set'}</p>
                      </div>
                      <div className={cx('rounded-2xl border p-4', softClass)}>
                        <p className={cx('text-xs font-black uppercase tracking-wide', mutedText)}>Account</p>
                        <p className="mt-2 font-semibold">{profile?.accountNumber || 'Not set'}</p>
                      </div>
                      <div className={cx('rounded-2xl border p-4 sm:col-span-2', softClass)}>
                        <p className={cx('text-xs font-black uppercase tracking-wide', mutedText)}>Account Holder</p>
                        <p className="mt-2 font-semibold">{profile?.accountHolderName || 'Not set'}</p>
                      </div>
                    </div>
                  </Panel>
                  <Panel title="Edit Store Profile" surfaceClass={surfaceClass}>
                    {!profileEditing ? (
                      <div className="space-y-4">
                        <p className={mutedText}>Update store details, payouts, and contact information. Your changes appear to buyers once saved.</p>
                        <button type="button" onClick={() => setProfileEditing(true)} className="rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">Edit profile</button>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="grid gap-4">
                        <Field label="Store Image"><input type="file" accept="image/*" onChange={handleProfileFileSelect} className="text-sm" /></Field>
                        {Object.keys(profileForm).map((field) => (
                          <Field key={field} label={field.replace(/([A-Z])/g, ' $1')}>
                            {field === 'brandDescription' ? (
                              <textarea value={profileForm[field]} onChange={(event) => setProfileForm({ ...profileForm, [field]: event.target.value })} className={inputClass} rows={4} />
                            ) : (
                              <input value={profileForm[field]} onChange={(event) => setProfileForm({ ...profileForm, [field]: event.target.value })} className={inputClass} />
                            )}
                          </Field>
                        ))}
                        <div className="flex flex-wrap gap-3">
                          <button className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={submitting}><Save size={16} /> Save</button>
                          <button type="button" onClick={() => setProfileEditing(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Cancel</button>
                        </div>
                      </form>
                    )}
                  </Panel>
                </section>
              )}

              {activeTab === 'products' && (
                <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                  <Panel title={editingProductId ? 'Product Composer' : 'Create Product'} surfaceClass={surfaceClass}>
                    <form onSubmit={handleSaveProduct} className="grid gap-4">
                      <Field label="Product Name"><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required className={inputClass} /></Field>
                      <Field label="Description"><textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className={inputClass} /></Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Price"><input type="number" min="0" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required className={inputClass} /></Field>
                        <Field label="Stock"><input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required className={inputClass} /></Field>
                      </div>
                      <Field label="Category">
                        <select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} required className={inputClass}>
                          <option value="">Select category</option>
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Product Media">
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={submitting || creatingProduct || updatingProduct || uploadingMedia}
                            className={cx(
                              'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition',
                              submitting || creatingProduct || updatingProduct || uploadingMedia
                                ? 'border-violet-500 bg-violet-500/10 text-violet-700 cursor-wait'
                                : isDark
                                  ? 'border-white/10 bg-slate-950 text-slate-100 hover:border-violet-500 hover:bg-violet-900/50'
                                  : 'border-slate-300 bg-white text-slate-900 hover:border-violet-500 hover:bg-violet-50',
                            )}
                          >
                            {submitting || creatingProduct || updatingProduct || uploadingMedia ? (
                              <>
                                <RotateCcw size={16} className="animate-spin" /> Uploading files...
                              </>
                            ) : (
                              <>
                                <ImagePlus size={16} />
                                {productFiles.length ? `${productFiles.length} file(s) selected` : 'Choose files'}
                              </>
                            )}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductFileSelect}
                            className="hidden"
                          />
                        </div>
                      </Field>
                      {productFilePreviews.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {productFilePreviews.map((preview, idx) => (
                            <img key={`${preview}-${idx}`} src={preview} alt={`Preview ${idx + 1}`} className="h-36 w-full rounded-xl object-cover" />
                          ))}
                        </div>
                      )}
                      <button className="inline-flex w-fit items-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={submitting}><PackagePlus size={16} /> {editingProductId && editingProductId !== 'new' ? 'Update product' : 'Publish product'}</button>
                    </form>
                  </Panel>
                  <Panel title="Live Products" surfaceClass={surfaceClass}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {products.map((product) => (
                        <article key={product._id} className={cx('rounded-xl border p-4', softClass)}>
                          {product.images?.length > 1 ? (
                            <div className="mb-3 h-36 w-full overflow-hidden rounded-lg">
                              <Carousel images={product.images.slice(0, 4)} interval={3000} className="h-36 w-full rounded-lg" />
                            </div>
                          ) : product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt={product.name} className="mb-3 h-36 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="mb-3 grid h-36 place-items-center rounded-lg bg-slate-100"><Box /></div>
                          )}
                          <h3 className="font-black">{product.name}</h3>
                          <p className={cx('text-sm', mutedText)}>{product.category}</p>
                          <strong className="mt-2 block text-violet-700">{formatCurrency(product.price)}</strong>
                          <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => handleStartEditProduct(product)} className="rounded-lg border px-3 py-2 text-xs font-bold">Edit</button>
                            <button type="button" onClick={() => confirmDeleteProduct(product._id)} disabled={submitting} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} /> Delete</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </Panel>
                </section>
              )}

              {activeTab === 'orders' && (
                <Panel title="Order Management" surfaceClass={surfaceClass}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}><tr>{['Order', 'Customer', 'Shipping', 'Amount', 'Status', 'Date', 'Update'].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-3 font-bold">#{order._id.slice(-6).toUpperCase()}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold">{order.buyer?.name || 'Unknown buyer'}</div>
                              <div className="text-xs text-slate-500">{order.buyer?.email}</div>
                              <div className="text-xs text-slate-500">{order.buyer?.phone || 'No phone'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold">{order.shippingAddress?.name || 'No shipping name'}</div>
                              <div className="text-xs text-slate-500">{order.shippingAddress?.address || 'No address'}</div>
                              <div className="text-xs text-slate-500">{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zipCode].filter(Boolean).join(', ')}</div>
                            </td>
                            <td className="px-4 py-3">{formatCurrency(order.totalAmount || order.total)}</td>
                            <td className="px-4 py-3">{humanizeStatus(order.status)}</td>
                            <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3"><select value={order.status} onChange={(event) => handleUpdateOrderStatus(order._id, event.target.value)} className={inputClass} disabled={submitting}>{['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{humanizeStatus(status)}</option>)}</select></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </>
          )}
        </main>
      </div>
      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  )
}

function Panel({ title, surfaceClass, children }) {
  return (
    <section className={cx('rounded-2xl border p-6 shadow-lg', surfaceClass)}>
      <h2 className="mb-5 text-2xl font-black tracking-normal">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold capitalize">{label}</span>
      {children}
    </label>
  )
}

function List({ products, empty, render }) {
  if (!products.length) return <p>{empty}</p>
  return <div className="grid gap-3">{products.map(render)}</div>
}
