import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, Boxes, LayoutDashboard, List, Loader2, LogOut, Megaphone, Menu, Moon, Receipt, Save, Sun, Tags, Trash2, Terminal, X, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import ConfirmModal from '../components/ConfirmModal'
import SectionLoader from '../components/SectionLoader'
import { useGetBrandsQuery, useCreateBrandMutation, useDeleteBrandMutation } from '../redux/slices/brandApiSlice'
import { useGetCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation } from '../redux/slices/categoryApiSlice'
import { useGetAdsQuery, useCreateAdMutation, useDeleteAdMutation } from '../redux/slices/adApiSlice'
import { useGetProductsQuery, useUpdateProductMutation, useDeleteProductMutation } from '../redux/slices/productApiSlice'
import { useGetDashboardStatsQuery, useGetAllUsersQuery, useGetPendingVendorsQuery, useApproveVendorMutation, useRejectVendorMutation, useDeleteUserMutation, useUpdateUserRoleMutation, useGetAllOrdersQuery } from '../redux/slices/adminApiSlice'

const sections = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'orders', icon: Receipt, label: 'Orders' },
  { key: 'users', icon: Users, label: 'Users' },
  { key: 'vendors', icon: AlertCircle, label: 'Vendors' },
  { key: 'products', icon: Boxes, label: 'Products' },
  { key: 'brands', icon: Tags, label: 'Brands' },
  { key: 'categories', icon: List, label: 'Categories' },
  { key: 'ads', icon: Megaphone, label: 'Ads' },
  { key: 'debug', icon: Terminal, label: 'Debug Console' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

const humanizeStatus = (status) => (status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export default function SuperAdmin() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { tab } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [section, setSection] = useState('dashboard')
  const [alerts, setAlerts] = useState([])
  const [searchUser, setSearchUser] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingVendor, setRejectingVendor] = useState(null)
  const [brandName, setBrandName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryIcon, setCategoryIcon] = useState('')
  const [adForm, setAdForm] = useState({ title: '', description: '', ctaText: '', link: '' })
  const [adImageFile, setAdImageFile] = useState(null)
  const adFileRef = useRef(null)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })

  // Fetch from API instead of localStorage
  const { data: productsData = [], isLoading: productsLoading, isError: productsError } = useGetProductsQuery()
  const { data: brandsData = [], isLoading: brandsLoading, isError: brandsError } = useGetBrandsQuery()
  const { data: categoriesData = [], isLoading: categoriesLoading, isError: categoriesError } = useGetCategoriesQuery()
  const { data: adsData = [], isLoading: adsLoading, isError: adsError } = useGetAdsQuery()
  const { data: dashboardStats = {}, isLoading: statsLoading, isError: statsError } = useGetDashboardStatsQuery()
  const { data: usersData = { users: [], total: 0 }, isLoading: usersLoading, isError: usersError } = useGetAllUsersQuery({ search: searchUser, role: userRole })
  const { data: vendorsData = { vendors: [], total: 0 }, isLoading: vendorsLoading, isError: vendorsError } = useGetPendingVendorsQuery()

  // API mutations for CRUD operations
  const [createBrand] = useCreateBrandMutation()
  const [deleteBrand] = useDeleteBrandMutation()
  const [createCategory] = useCreateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()
  const [createAd] = useCreateAdMutation()
  const [deleteAd] = useDeleteAdMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [approveVendor] = useApproveVendorMutation()
  const [rejectVendor] = useRejectVendorMutation()
  const [deleteUser] = useDeleteUserMutation()
  const [updateUserRole] = useUpdateUserRoleMutation()

  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedUserRoles, setSelectedUserRoles] = useState({})
  const ads = Array.isArray(adsData) ? adsData : []
  const users = usersData.users || []
  const vendors = vendorsData.vendors || []
  const products = Array.isArray(productsData) ? productsData : []
  const brands = Array.isArray(brandsData) ? brandsData.map((b) => b.name) : []
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  const { data: ordersData = { orders: [] }, isLoading: ordersLoading, isError: ordersError } = useGetAllOrdersQuery(undefined)
  const orders = ordersData.orders || []

  const safeProducts = Array.isArray(products) ? products : []
  const safeBrands = Array.isArray(brands) ? brands : []
  const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : []
  const safeAds = Array.isArray(ads) ? ads : []
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const inputClass = cx('w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

  const showAlert = (message, type = 'info') => {
    const id = Date.now()
    setAlerts((current) => [...current, { id, message, type }])
    setTimeout(() => setAlerts((current) => current.filter((alert) => alert.id !== id)), 5000)
  }

  const handleApproveVendor = async (vendorId) => {
    try {
      await approveVendor(vendorId).unwrap()
      showAlert('Vendor approved successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to approve vendor', 'error')
    }
  }

  const handleRejectVendor = async (vendorId) => {
    if (!rejectReason.trim()) {
      showAlert('Please provide a rejection reason', 'warning')
      return
    }
    try {
      await rejectVendor({ vendorId, reason: rejectReason }).unwrap()
      setRejectingVendor(null)
      setRejectReason('')
      showAlert('Vendor rejected successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to reject vendor', 'error')
    }
  }

  const handleDeleteUser = async (userId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete user',
      description: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setConfirmDialog((current) => ({ ...current, loading: true }))
        try {
          await deleteUser(userId).unwrap()
          showAlert('User deleted successfully!', 'success')
        } catch (err) {
          showAlert(err?.data?.message || 'Failed to delete user', 'error')
        } finally {
          setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
        }
      },
    })
  }

  const handleChangeUserRole = (userId, role) => {
    setSelectedUserRoles((current) => ({
      ...current,
      [userId]: role,
    }))
  }

  const handleUpdateUserRole = async (userId) => {
    const role = selectedUserRoles[userId]
    if (!role?.trim()) {
      showAlert('Please select a role before saving', 'warning')
      return
    }

    try {
      await updateUserRole({ userId, role }).unwrap()
      setSelectedUserRoles((current) => {
        const next = { ...current }
        delete next[userId]
        return next
      })
      showAlert('User role updated successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to update user role', 'error')
    }
  }

  const filteredProducts = safeProducts.filter((product) =>
    !productSearch ||
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase()),
  )

  const analytics = useMemo(() => {
    const avgPrice = safeProducts.length ? safeProducts.reduce((sum, product) => sum + (product.price || 0), 0) / safeProducts.length : 0
    const countBy = (key) => safeProducts.reduce((acc, product) => {
      const value = product[key] || 'Not set'
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
    const top = (counts) => Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '-'
    return {
      avgPrice,
      topBrand: top(countBy('brand')),
      topCategory: top(countBy('category')),
      topUniversity: top(countBy('university')),
    }
  }, [safeProducts])

  useEffect(() => {
    if (tab && sections.some((sectionItem) => sectionItem.key === tab)) {
      setSection(tab)
    } else if (!tab) {
      setSection('dashboard')
    }
  }, [tab])

  const navigateTo = (next) => {
    setSection(next)
    setSidebarOpen(false)
    navigate(next === 'dashboard' ? '/super-admin' : `/super-admin/${next}`)
  }

  const saveProductEdit = async (event) => {
    event.preventDefault()
    if (!editingProduct) return

    try {
      await updateProduct({
        id: editingProduct.id || editingProduct._id,
        ...editingProduct,
        price: parseFloat(editingProduct.price),
      }).unwrap()
      setEditingProduct(null)
      showAlert('Product updated successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to update product', 'error')
    }
  }

  const addBrand = async (event) => {
    event.preventDefault()
    const name = brandName.trim()
    if (!name) return showAlert('Please enter a brand name', 'warning')
    if (safeBrands.includes(name)) return showAlert('This brand already exists', 'warning')
    try {
      await createBrand({ name }).unwrap()
      setBrandName('')
      showAlert('Brand added successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to add brand', 'error')
    }
  }

  const addCategory = async (event) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return showAlert('Please enter a category name', 'warning')
    if (safeCategories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return showAlert('This category already exists', 'warning')
    try {
      await createCategory({ name, icon: categoryIcon.trim() }).unwrap()
      setCategoryName('')
      setCategoryIcon('')
      showAlert('Category added successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to add category', 'error')
    }
  }

  const addAd = async (event) => {
    event.preventDefault()
    if (!adForm.title || !adForm.description || !adForm.ctaText || !adImageFile) return showAlert('Please complete all required ad fields.', 'warning')

    try {
      const formData = new FormData()
      formData.append('title', adForm.title)
      formData.append('description', adForm.description)
      formData.append('ctaText', adForm.ctaText)
      formData.append('link', adForm.link || '/shop')
      formData.append('image', adImageFile)

      await createAd(formData).unwrap()
      setAdForm({ title: '', description: '', ctaText: '', link: '' })
      setAdImageFile(null)
      if (adFileRef.current) adFileRef.current.value = ''
      showAlert('Homepage ad published successfully!', 'success')
    } catch (err) {
      showAlert(err?.data?.message || 'Failed to publish ad', 'error')
    }
  }

  const logout = () => {
    localStorage.removeItem('currentUser')
    window.dispatchEvent(new Event('campusThreadAuthUpdate'))
    navigate('/super-admin-login')
  }

  return (
    <div className={cx('min-h-screen lg:grid lg:grid-cols-[17rem_1fr]', pageClass)}>
      <aside className={cx('fixed inset-y-0 left-0 z-40 w-72 border-r p-4 transition lg:static lg:block lg:w-auto', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-black uppercase text-violet-700">Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span></Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="mt-8 grid gap-2">
          {sections.map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => navigateTo(key)} className={cx('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition', section === key ? 'bg-violet-700 text-white' : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100')}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        <header className={cx('sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
            <div>
              <h1 className="text-2xl font-black tracking-normal">Super Admin</h1>
              <p className={cx('text-sm', mutedText)}>Manage marketplace content and local catalog data.</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={toggleTheme} className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg', isDark ? 'bg-slate-800 text-amber-200' : 'bg-slate-100 text-slate-700')}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
              <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="fixed right-4 top-20 z-50 grid gap-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={cx('rounded-xl px-4 py-3 text-sm font-bold shadow-lg', alert.type === 'success' ? 'bg-emerald-600 text-white' : alert.type === 'warning' ? 'bg-amber-500 text-slate-950' : alert.type === 'danger' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white')}>
                {alert.message}
              </div>
            ))}
          </div>

          {/* Dashboard Section */}
          {section === 'dashboard' && (
            (statsLoading || productsLoading || brandsLoading || categoriesLoading || adsLoading || usersLoading || vendorsLoading) ? (
              <SectionLoader message="Loading dashboard..." isDark={isDark} />
            ) : (
              <div className="space-y-6">
                <div className={cx('rounded-lg border p-6 shadow-lg', isDark ? 'border-violet-500/20 bg-gradient-to-br from-violet-900/30 to-violet-800/20' : 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={cx('text-sm font-semibold uppercase tracking-wider', isDark ? 'text-violet-400' : 'text-violet-600')}>💰 Platform Revenue Summary</h2>
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className={cx('text-xs', mutedText)}>Total Revenue (All Paid Orders)</p>
                          <p className="mt-1 text-4xl font-black">₦{Number(dashboardStats.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className={cx('text-xs', mutedText)}>Paid Orders</p>
                            <p className="mt-1 text-2xl font-bold">{dashboardStats.totalOrders || 0}</p>
                          </div>
                          <div>
                            <p className={cx('text-xs', mutedText)}>Avg per Order</p>
                            <p className="mt-1 text-2xl font-bold">₦{Number(dashboardStats.avgOrderValue || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className={cx('text-xs', mutedText)}>Service Commission (10%)</p>
                            <p className="mt-1 text-2xl font-bold">₦{Number(dashboardStats.serviceCommission || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">💵</div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Total Users" value={dashboardStats.totalUsers || 0} surfaceClass={surfaceClass} isDark={isDark} />
                  <StatCard title="Total Vendors" value={dashboardStats.totalVendors || 0} surfaceClass={surfaceClass} isDark={isDark} onClick={() => navigate('/super-admin/vendors')} />
                  <StatCard title="Pending Vendors" value={vendors.length} surfaceClass={surfaceClass} isDark={isDark} />
                  <StatCard title="Orders" value={orders.length} surfaceClass={surfaceClass} isDark={isDark} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Products" value={products.length} surfaceClass={surfaceClass} isDark={isDark} />
                  <StatCard title="Brands" value={brands.length} surfaceClass={surfaceClass} isDark={isDark} />
                  <StatCard title="Categories" value={categories.length} surfaceClass={surfaceClass} isDark={isDark} />
                  <StatCard title="Active Ads" value={ads.length} surfaceClass={surfaceClass} isDark={isDark} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard title="Total Revenue" value={`₦${Number(dashboardStats.totalRevenue || 0).toLocaleString()}`} surfaceClass={surfaceClass} isDark={isDark} sensitive={true} />
                  <StatCard title="Avg Order Value" value={`₦${Number(dashboardStats.avgOrderValue || 0).toLocaleString()}`} surfaceClass={surfaceClass} isDark={isDark} />
                </div>

                <Panel title="Recent Orders" surfaceClass={surfaceClass}>
                  {orders.length === 0 ? (
                    <div className={cx('rounded-3xl border border-dashed p-8 text-center', surfaceClass)}>
                      No orders yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order._id} className={cx('rounded-3xl border p-4', surfaceClass)}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-bold">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</p>
                              <p className={cx('text-sm', mutedText)}>{order.buyer?.name || 'Unknown buyer'}</p>
                              <p className={cx('text-xs', mutedText)}>{order.buyer?.email || 'No email'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black">₦{Number(order.totalAmount || order.total || 0).toLocaleString()}</p>
                              <p className={cx('text-xs', mutedText)}>{humanizeStatus(order.status)}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-300">
                            <div>
                              <span className="font-semibold">Products:</span>
                              <div className="mt-1 space-y-1">
                                {order.items?.map((item, idx) => (
                                  <div key={`${item.product || item.name}-${idx}`}>{item.name} ×{item.quantity}</div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold">Shipping:</span> {order.shippingAddress?.address || 'No address'}, {order.shippingAddress?.city || ''} {order.shippingAddress?.state || ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )
          )}
          {section === 'orders' && (
            <Panel title="Order Management" surfaceClass={surfaceClass}>
              {ordersLoading ? (
                <SectionLoader message="Loading orders..." isDark={isDark} />
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  No orders found
                </div>
              ) : (
                <>
                  <div className="space-y-4 sm:hidden">
                    {orders.map((order) => {
                      const totalQty = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
                      return (
                        <div key={order._id} className={cx('rounded-3xl border p-4 shadow-sm', surfaceClass)}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold">#{order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="font-semibold">Buyer:</span> {order.buyer?.name || order.buyer?.email || 'Unknown'}
                            </div>
                            <div>
                              <span className="font-semibold">Amount:</span> ₦{Number(order.totalAmount || order.total || 0).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-semibold">Status:</span> {humanizeStatus(order.status)}
                            </div>
                            <div>
                              <span className="font-semibold">Payment:</span> {order.paymentMethod || 'Unknown'} / {order.paymentStatus || 'pending'}
                            </div>
                            <div>
                              <span className="font-semibold">Items:</span> {order.items?.map((item) => `${item.name}×${item.quantity}`).join(', ') || 'No items'}
                            </div>
                            <div>
                              <span className="font-semibold">Ship to:</span> {order.shippingAddress?.name || 'No name'}, {order.shippingAddress?.city || ''}{order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}{order.shippingAddress?.state || ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-[900px] w-full table-auto text-left text-xs">
                      <colgroup>
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                      </colgroup>
                      <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}>
                        <tr>
                          {['Order', 'Buyer', 'Items', 'Qty', 'Ship', 'Amt', 'Pay', 'Status', 'Date'].map((head) => <th key={head} className="px-3 py-2 font-black whitespace-normal break-words">{head}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {orders.map((order) => {
                          const totalQty = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
                          return (
                            <tr key={order._id}>
                              <td className="px-3 py-2 font-bold text-xs">#{order._id.slice(-6).toUpperCase()}</td>
                              <td className="px-3 py-2 max-w-[160px] whitespace-normal text-xs">
                                <div className="font-bold truncate">{order.buyer?.name || 'Unknown buyer'}</div>
                                <div className="truncate text-slate-500">{order.buyer?.email}</div>
                                <div className="truncate text-slate-500">{order.buyer?.phone || 'No phone'}</div>
                              </td>
                              <td className="px-3 py-2 max-w-[180px] whitespace-normal text-xs text-slate-500">
                                <div className="space-y-1">
                                  {order.items?.map((item, idx) => (
                                    <div key={`${item.product || item.name}-${idx}`}>{item.name} ×{item.quantity}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">{totalQty}</td>
                              <td className="px-3 py-2 max-w-[180px] whitespace-normal text-xs">
                                <div className="font-bold truncate">{order.shippingAddress?.name || 'No name'}</div>
                                <div className="truncate text-slate-500">{order.shippingAddress?.address || 'No address'}</div>
                                <div className="truncate text-slate-500">{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zipCode].filter(Boolean).join(', ')}</div>
                              </td>
                              <td className="px-3 py-2 text-xs">₦{Number(order.totalAmount || order.total || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-xs">
                                <div className="font-bold truncate">{order.paymentMethod || 'Unknown'}</div>
                                <div className="truncate text-slate-500">{order.paymentStatus || 'pending'}</div>
                              </td>
                              <td className="px-4 py-3">{humanizeStatus(order.status)}</td>
                              <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Panel>
          )}

          {/* Debug Console Section */}
          {section === 'debug' && (
            <Panel title="Admin Debug Console" surfaceClass={surfaceClass}>
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: 'Products', items: safeProducts, loading: productsLoading, error: productsError },
                    { label: 'Brands', items: safeBrands, loading: brandsLoading, error: brandsError },
                    { label: 'Categories', items: safeCategories, loading: categoriesLoading, error: categoriesError },
                    { label: 'Ads', items: safeAds, loading: adsLoading, error: adsError },
                    { label: 'Users', items: users, loading: usersLoading, error: usersError },
                    { label: 'Pending Vendors', items: vendors, loading: vendorsLoading, error: vendorsError },
                  ].map((debugItem) => (
                    <div key={debugItem.label} className={cx('min-w-0 rounded-lg border p-4', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold">{debugItem.label}</h3>
                          <p className={cx('text-xs', mutedText)}>{debugItem.loading ? 'Loading…' : debugItem.error ? 'Error fetching backend data' : 'Backend fetch OK'}</p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{Array.isArray(debugItem.items) ? debugItem.items.length : 'N/A'}</span>
                      </div>
                      <pre className={cx('max-h-52 w-full overflow-auto rounded-md border p-3 text-xs whitespace-pre-wrap break-words', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900')}>
                        {JSON.stringify(debugItem.items.slice(0, 10), null, 2)}
                      </pre>
                      {Array.isArray(debugItem.items) && debugItem.items.length > 10 && (
                        <p className={cx('mt-2 text-xs', mutedText)}>Showing first 10 items of {debugItem.items.length}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className={cx('rounded-lg border p-4', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                  <h3 className="font-bold">Dashboard Stats</h3>
                  <pre className={cx('max-h-72 w-full overflow-auto rounded-md border p-3 text-xs whitespace-pre-wrap break-words', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900')}>
                    {JSON.stringify(dashboardStats, null, 2)}
                  </pre>
                </div>
              </div>
            </Panel>
          )}

          {/* Analytics Section */}
          {section === 'analytics' && (
            statsLoading ? (
              <SectionLoader message="Loading analytics..." isDark={isDark} />
            ) : (
              <Panel title="Platform Analytics" surfaceClass={surfaceClass}>
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={cx('rounded-lg border p-6', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <h3 className="font-bold">User Statistics</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Users</span>
                          <span className="font-bold">{dashboardStats.totalUsers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>Active Users (30d)</span>
                          <span className="font-bold">{dashboardStats.activeUsers30d || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>New Users (7d)</span>
                          <span className="font-bold">{dashboardStats.newUsers7d || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className={cx('rounded-lg border p-6', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <h3 className="font-bold">Order Analytics</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Orders</span>
                          <span className="font-bold">{dashboardStats.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Revenue</span>
                          <span className="font-bold">₦{Number(dashboardStats.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>Avg Order Value</span>
                          <span className="font-bold">₦{Number(dashboardStats.avgOrderValue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={cx('rounded-lg border p-6', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <h3 className={cx('font-bold', isDark ? 'text-violet-400' : 'text-violet-600')}>💰 Revenue Metrics</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Revenue</span>
                          <span className="font-black text-lg">₦{Number(dashboardStats.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>Avg Order Value</span>
                          <span className="font-bold">₦{Number(dashboardStats.avgOrderValue || 0).toLocaleString()}</span>
                        </div>
                        <div className="mt-3 pt-3" style={isDark ? { borderTop: '1px solid rgba(255, 255, 255, 0.1)' } : { borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                          <p className={cx('text-xs', mutedText)}>Revenue from all paid orders on the platform</p>
                        </div>
                      </div>
                    </div>

                    <div className={cx('rounded-lg border p-6', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <h3 className="font-bold">Catalog Statistics</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Products</span>
                          <span className="font-bold">{dashboardStats.totalProducts || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedText}>Total Brands</span>
                          <span className="font-bold">{dashboardStats.totalBrands || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            )
          )}

          {/* Users Section */}
          {section === 'users' && (
            <Panel title="User Management" surfaceClass={surfaceClass}>
              <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search users..." className={inputClass} />
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className={inputClass}>
                  <option value="">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              {usersLoading ? (
                <SectionLoader message="Loading users..." isDark={isDark} />
              ) : (
                <div className={cx('overflow-x-auto rounded-3xl border shadow-sm', isDark ? 'border-white/10 bg-slate-900 shadow-black/40' : 'border-slate-200 bg-white shadow-slate-200/60')}>
                  <table className="w-full min-w-[900px] text-left text-sm border-separate border-spacing-0">
                    <thead className={cx('sticky top-0', isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-700')}>
                      <tr>
                        {['Name', 'Email', 'Role', 'Status', 'University', 'Joined', 'Actions'].map((head) => <th key={head} className={cx('px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em]', isDark ? 'text-slate-400' : 'text-slate-600')}>{head}</th>)}
                      </tr>
                    </thead>
                    <tbody className={cx('text-sm divide-y', isDark ? 'divide-white/5' : 'divide-slate-200')}>
                      {users.length > 0 ? (
                        users.map((user) => {
                          const chosenRole = selectedUserRoles[user._id] || user.role
                          return (
                            <tr key={user._id} className={cx('transition', isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')}>
                              <td className={cx('px-4 py-4 font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>{user.name}</td>
                              <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{user.email}</td>
                              <td className="px-4 py-4">
                                <span className={cx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', user.role === 'vendor' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')}>
                                  {user.role}
                                </span>
                              </td>
                              <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{user.vendorStatus || 'active'}</td>
                              <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{user.university || '-'}</td>
                              <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{new Date(user.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={chosenRole}
                                    onChange={(e) => handleChangeUserRole(user._id, e.target.value)}
                                    className={cx('rounded-full border px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-violet-500', isDark ? 'border-white/10 bg-slate-800 text-slate-100 placeholder-slate-500' : 'border-slate-200 bg-white text-slate-950 placeholder-slate-400')}
                                  >
                                    <option value="customer">Customer</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserRole(user._id)}
                                    className={cx('rounded-full px-3 py-2 text-xs font-semibold transition', isDark ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-violet-700 text-white hover:bg-violet-800')}
                                  >
                                    Save
                                  </button>
                                  <button type="button" onClick={() => handleDeleteUser(user._id)} className={cx('rounded-full border px-3 py-2 text-xs font-semibold transition', isDark ? 'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60' : 'border-red-500 text-red-500 hover:bg-red-50')}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className={cx('px-4 py-8 text-center', isDark ? 'text-slate-400' : 'text-slate-500')}>
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {/* Vendors Section */}
          {section === 'vendors' && (
            <Panel title="Vendor Approvals" surfaceClass={surfaceClass}>
              {vendorsLoading ? (
                <SectionLoader message="Loading vendors..." isDark={isDark} />
              ) : vendors.length > 0 ? (
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                    <div key={vendor._id} className={cx('rounded-lg border p-4', isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className={cx('font-bold', isDark ? 'text-slate-100' : 'text-slate-950')}>{vendor.brandName || vendor.name || 'Unknown vendor'}</h3>
                          <p className={cx('text-sm', mutedText)}>{vendor.email}</p>
                          <p className={cx('mt-1 text-sm', mutedText)}>Account: {vendor.accountHolderName}</p>
                          <p className={cx('text-sm', mutedText)}>Bank: {vendor.bankName}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleApproveVendor(vendor._id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button onClick={() => setRejectingVendor(vendor._id)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>

                      {rejectingVendor === vendor._id && (
                        <div className="mt-4 flex gap-2 border-t border-slate-300 dark:border-white/10 pt-4">
                          <input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className={cx(inputClass, 'flex-1')}
                          />
                          <button onClick={() => handleRejectVendor(vendor._id)} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
                            Submit
                          </button>
                          <button onClick={() => { setRejectingVendor(null); setRejectReason('') }} className="rounded-lg bg-slate-600 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No pending vendor approvals</p>
                </div>
              )}
            </Panel>
          )}

          {section === 'products' && (
            <Panel title="Products" surfaceClass={surfaceClass}>
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products..." className={cx(inputClass, 'mb-5')} />
              {productsLoading ? (
                <SectionLoader message="Loading products..." isDark={isDark} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}>
                      <tr>{['Name', 'Brand', 'Category', 'Price', 'Actions'].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                      {filteredProducts.map((product) => (
                        <tr key={product.id || product._id}>
                          <td className="px-4 py-3 font-bold">{product.name}</td>
                          <td className="px-4 py-3">{product.brand}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3">₦{(product.price || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => setEditingProduct(product)} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white">Edit</button>
                            <button type="button" onClick={async () => {
                              setConfirmDialog({
                                open: true,
                                title: 'Delete product',
                                description: 'Are you sure you want to delete this product?',
                                confirmLabel: 'Delete',
                                cancelLabel: 'Cancel',
                                onConfirm: async () => {
                                  setConfirmDialog((current) => ({ ...current, loading: true }))
                                  try {
                                    await deleteProduct(product.id || product._id).unwrap()
                                  } catch (err) {
                                    showAlert(err?.data?.message || 'Failed to delete product', 'error')
                                  } finally {
                                    setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
                                  }
                                },
                              })
                            }} className="ml-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {section === 'brands' && (
            <Panel title="Brands" surfaceClass={surfaceClass}>
              {brandsLoading ? (
                <SectionLoader message="Loading brands..." isDark={isDark} />
              ) : (
                <>
                  <form onSubmit={addBrand} className="mb-6 flex gap-3">
                    <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="New brand" className={inputClass} />
                    <button className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-bold text-white">Add</button>
                  </form>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {brands.map((brand) => (
                      <div key={brand} className={cx('flex items-center justify-between rounded-xl border p-4', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                        <strong>{brand}</strong>
                        <button type="button" onClick={() => {
                          const brandObj = brandsData.find((b) => b.name === brand)
                          if (brandObj?._id) {
                            setConfirmDialog({
                              open: true,
                              title: 'Delete brand',
                              description: 'Are you sure you want to delete this brand?',
                              confirmLabel: 'Delete',
                              cancelLabel: 'Cancel',
                              onConfirm: async () => {
                                setConfirmDialog((current) => ({ ...current, loading: true }))
                                try {
                                  await deleteBrand(brandObj._id).unwrap()
                                  showAlert('Brand deleted successfully!', 'success')
                                } catch (err) {
                                  showAlert(err?.data?.message || 'Failed to delete brand', 'error')
                                } finally {
                                  setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
                                }
                              },
                            })
                          }
                        }} className="text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          )}

          {section === 'categories' && (
            <Panel title="Categories" surfaceClass={surfaceClass}>
              {categoriesLoading ? (
                <SectionLoader message="Loading categories..." isDark={isDark} />
              ) : (
                <>
                  <form onSubmit={addCategory} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" className={inputClass} />
                    <input value={categoryIcon} onChange={(event) => setCategoryIcon(event.target.value)} placeholder="Icon name" className={inputClass} />
                    <button className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-bold text-white">Add</button>
                  </form>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div key={category._id || category.name} className={cx('flex items-center justify-between rounded-xl border p-4', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                        <strong>{category.name}</strong>
                        <button type="button" onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Delete category',
                            description: 'Are you sure you want to delete this category?',
                            confirmLabel: 'Delete',
                            cancelLabel: 'Cancel',
                            onConfirm: async () => {
                              setConfirmDialog((current) => ({ ...current, loading: true }))
                              try {
                                await deleteCategory(category._id).unwrap()
                                showAlert('Category deleted successfully!', 'success')
                              } catch (err) {
                                showAlert(err?.data?.message || 'Failed to delete category', 'error')
                              } finally {
                                setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
                              }
                            },
                          })
                        }} className="text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          )}

          {section === 'ads' && (
            <Panel title="Homepage Ads" surfaceClass={surfaceClass}>
              {adsLoading ? (
                <SectionLoader message="Loading ads..." isDark={isDark} />
              ) : (
                <>
                  <form onSubmit={addAd} className="mb-6 space-y-4">
                    <input value={adForm.title} onChange={(event) => setAdForm({ ...adForm, title: event.target.value })} placeholder="Ad Title" className={inputClass} />
                    <textarea value={adForm.description} onChange={(event) => setAdForm({ ...adForm, description: event.target.value })} placeholder="Ad Description" rows="3" className={inputClass} />
                    <input value={adForm.ctaText} onChange={(event) => setAdForm({ ...adForm, ctaText: event.target.value })} placeholder="CTA Text" className={inputClass} />
                    <input value={adForm.link} onChange={(event) => setAdForm({ ...adForm, link: event.target.value })} placeholder="Link" className={inputClass} />
                    <input type="file" ref={adFileRef} onChange={(event) => setAdImageFile(event.target.files[0])} className={inputClass} />
                    <button className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-bold text-white">Publish Ad</button>
                  </form>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {ads.map((ad) => (
                      <div key={ad._id || ad.id} className={cx('rounded-lg border overflow-hidden', surfaceClass)}>
                        <img src={ad.image || ad.imageUrl} alt={ad.title} className="h-40 w-full object-cover" />
                        <div className="p-4">
                          <h3 className="font-bold">{ad.title}</h3>
                          <p className={cx('text-xs mt-1', mutedText)}>{ad.description}</p>
                          <button type="button" onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: 'Delete ad',
                              description: 'Are you sure you want to delete this ad?',
                              confirmLabel: 'Delete',
                              cancelLabel: 'Cancel',
                              onConfirm: async () => {
                                setConfirmDialog((current) => ({ ...current, loading: true }))
                                try {
                                  await deleteAd(ad._id || ad.id).unwrap()
                                  showAlert('Ad deleted successfully!', 'success')
                                } catch (err) {
                                  showAlert(err?.data?.message || 'Failed to delete ad', 'error')
                                } finally {
                                  setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })
                                }
                              },
                            })
                          }} className="mt-4 w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          )}
        </main>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={saveProductEdit} className={cx('w-full max-w-lg rounded-2xl border p-6 shadow-xl', surfaceClass)}>
            <h2 className="text-2xl font-black">Edit Product</h2>
            <div className="mt-5 grid gap-4">
              {['name', 'brand', 'category', 'price', 'description'].map((field) => (
                <label key={field} className="block">
                  <span className="text-sm font-bold capitalize">{field}</span>
                  <input value={editingProduct[field] || ''} onChange={(event) => setEditingProduct({ ...editingProduct, [field]: event.target.value })} className={cx(inputClass, 'mt-2')} />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingProduct(null)} className={cx('rounded-lg border px-4 py-2 text-sm font-bold', isDark ? 'border-white/10' : 'border-slate-200')}>Cancel</button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white"><Save size={16} /> Save</button>
            </div>
          </form>
        </div>
      )}
      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false, title: '', description: '', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: null, loading: false })}
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

function StatCard({ title, value, surfaceClass, isDark, onClick, sensitive = false }) {
  let display = value
  if (sensitive) {
    try {
      const saved = localStorage.getItem('dashboardShowRevenue')
      const show = saved === 'false' ? false : true
      if (!show) display = '••••••'
    } catch (e) {
      // ignore and show value by default
    }
  }

  return (
    <article
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'rounded-2xl border p-6 shadow-lg transition',
        surfaceClass,
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl' : '',
      )}
    >
      <p className={cx('text-sm font-black uppercase tracking-wide', isDark ? 'text-violet-400' : 'text-violet-700')}>{title}</p>
      <h3 className={cx('mt-3 text-3xl font-black tracking-normal', isDark ? 'text-slate-100' : 'text-slate-950')}>{display}</h3>
    </article>
  )
}


