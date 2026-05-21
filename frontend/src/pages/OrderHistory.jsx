import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useGetVendorOrdersQuery, useLazyGetUserOrdersQuery } from '../redux/slices/orderApiSlice'

const NAV_LINKS = [
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))

const getVendorItems = (order, vendorId) => {
  if (!order?.items || !vendorId) return order?.items || []
  return order.items.filter((item) => {
    const itemVendor = item.vendor?._id || item.vendor
    return String(itemVendor) === String(vendorId)
  })
}

export default function OrderHistory() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const { notifications } = useNotification()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isVendor = user?.role === 'vendor'
  const vendorQuery = useGetVendorOrdersQuery(undefined, { skip: !isVendor })
  const [triggerUserOrders, userQuery] = useLazyGetUserOrdersQuery()
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

  // Trigger user orders fetch once auth/user is available
  useEffect(() => {
    if (!isVendor && user) {
      triggerUserOrders()
    }
  }, [isVendor, user, triggerUserOrders])

  useEffect(() => {
    const response = isVendor ? vendorQuery.data : userQuery.data
    const requestError = isVendor ? vendorQuery.error : userQuery.error
    const requestLoading = isVendor ? vendorQuery.isFetching : userQuery.isFetching

    setLoading(requestLoading)
    if (response?.orders) {
      setOrders(response.orders)
      setError(null)
      return
    }
    if (requestError) setError(requestError?.data?.message || requestError?.error || 'Unable to load orders')
  }, [isVendor, userQuery.data, userQuery.error, userQuery.isFetching, vendorQuery.data, vendorQuery.error, vendorQuery.isFetching, user])

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Order History</h1>
            <p className={cx('mt-3 leading-7', mutedText)}>Review past purchases and track order status in one place.</p>
          </div>
          <Link to="/shop" className={cx('inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
            Continue Shopping
          </Link>
        </div>

        {loading && <p className={mutedText}>Loading orders...</p>}
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {orders.length === 0 && !loading ? (
          <div className={cx('rounded-2xl border-2 border-dashed p-12 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
            <Receipt size={42} className="mx-auto mb-4" />
            <p className="text-lg font-bold">No orders found yet.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
              Browse products
            </Link>
          </div>
        ) : (
          orders.length > 0 && (
            <div className={cx('overflow-hidden rounded-2xl border shadow-lg', surfaceClass)}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}>
                    <tr>
                      {['Order', 'Product', ...(isVendor ? ['Customer'] : []), 'Amount', 'Status', 'Payment', 'Date / Time'].map((head) => (
                        <th key={head} className="px-5 py-4 font-black">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {orders.map((order) => {
                      const created = new Date(order.createdAt)
                      const dateText = created.toLocaleDateString()
                      const timeText = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      const vendorItems = isVendor ? getVendorItems(order, user?._id) : order.items || []
                      const displayAmount = isVendor
                        ? vendorItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
                        : order.totalAmount || order.total || 0
                      const productNames = vendorItems.map((item) => item.name).filter(Boolean)

                      return (
                        <tr key={order._id}>
                          <td className="px-5 py-4">
                            <strong>{order.orderNumber || order._id.slice(-6).toUpperCase()}</strong>
                            <div className={cx('mt-1', mutedText)}>{vendorItems.length || order.items?.length || 0} item(s)</div>
                          </td>
                          <td className="px-5 py-4 max-w-[240px]">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {productNames.length > 0 ? productNames[0] : 'No product name'}
                            </div>
                            {productNames.length > 1 && (
                              <div className={cx('mt-1 text-xs', mutedText)}>
                                +{productNames.length - 1} more
                              </div>
                            )}
                          </td>
                          {isVendor && (
                            <td className="px-5 py-4 max-w-[200px] text-xs text-slate-500">
                              <div className="font-bold truncate">{order.buyer?.name || 'Unknown buyer'}</div>
                              <div className="truncate">{order.buyer?.email || 'No email'}</div>
                              <div className="truncate">{order.buyer?.phone || 'No phone'}</div>
                            </td>
                          )}
                          <td className="px-5 py-4 font-bold">{formatCurrency(displayAmount)}</td>
                          <td className="px-5 py-4"><StatusPill value={order.status} /></td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{order.paymentMethod?.toUpperCase() || 'Paystack'}</div>
                            <div className={cx('mt-1 text-sm', mutedText)}>{order.paymentStatus}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div>{dateText}</div>
                            <div className={cx('mt-1 text-sm', mutedText)}>{timeText}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  )
}

function StatusPill({ value }) {
  const tone = value === 'pending'
    ? 'bg-amber-100 text-amber-800'
    : value === 'delivered'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-blue-100 text-blue-800'
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tone}`}>{value}</span>
}
