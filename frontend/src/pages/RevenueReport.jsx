import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, Eye, EyeOff, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import { useGetAllOrdersQuery } from '../redux/slices/adminApiSlice'
import { orderAPI } from '../utils/api'

const filterOptions = [
    { key: 'today', label: 'Today', icon: Clock3 },
    { key: 'month', label: 'This month', icon: CalendarDays },
    { key: 'year', label: 'This year', icon: Layers },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')
const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))

function isSameDay(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDate() === dateB.getDate()
}

function isSameMonth(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth()
}

export default function RevenueReport({ role }) {
    const navigate = useNavigate()
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [filter, setFilter] = useState('today')
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(role !== 'admin')
    const [error, setError] = useState(null)
    const [showRevenue, setShowRevenue] = useState(() => {
        const saved = localStorage.getItem('dashboardShowRevenue')
        return saved === 'false' ? false : true
    })
    const [isCleared, setIsCleared] = useState(false)
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)

    const {
        data: adminOrdersData,
        isLoading: adminLoading,
        isError: adminError,
    } = useGetAllOrdersQuery({ page: 1, limit: 500 }, { skip: role !== 'admin' })

    useEffect(() => {
        localStorage.setItem('dashboardShowRevenue', showRevenue)
    }, [showRevenue])

    useEffect(() => {
        if (role !== 'vendor' || isCleared) return

        const fetchVendorOrders = async () => {
            setLoading(true)
            setError(null)

            try {
                const response = await orderAPI.getVendorOrders({ page: 1, limit: 500 })
                setOrders(response.orders || [])
            } catch (err) {
                setError(err.message || 'Unable to load vendor orders')
            } finally {
                setLoading(false)
            }
        }

        fetchVendorOrders()
    }, [role, isCleared])

    useEffect(() => {
        if (role !== 'admin') return
        if (adminLoading) return

        if (adminError) {
            setError('Unable to load orders')
            return
        }

        if (!isCleared) {
            setOrders(adminOrdersData?.orders || [])
        }
    }, [adminError, adminLoading, adminOrdersData, role, isCleared])

    const clearAll = () => {
        setOrders([])
        setFilter('today')
        setError(null)
        setIsCleared(true)
        setConfirmClearOpen(false)
        setLoading(false)
    }

    const filteredOrders = useMemo(() => {
        const now = new Date()
        return orders.filter((order) => {
            const created = order.createdAt ? new Date(order.createdAt) : new Date(order.date || Date.now())
            if (filter === 'today') return isSameDay(created, now)
            if (filter === 'month') return isSameMonth(created, now)
            if (filter === 'year') return created.getFullYear() === now.getFullYear()
            return true
        })
    }, [orders, filter])

    const paidOrders = filteredOrders.filter((order) => order.paymentStatus === 'paid')
    const { user } = useAuth()

    // For admin we sum full order totals. For vendors, sum only the items that belong to the vendor.
    const totalRevenue = paidOrders.reduce((sum, order) => {
        if (role === 'vendor' && user && user._id) {
            const vendorItemsTotal = (order.items || []).reduce((s, it) => {
                const vendorId = it.vendor?._id || it.vendor
                if (!vendorId) return s
                if (String(vendorId) === String(user._id)) return s + Number(it.price || 0) * Number(it.quantity || 0)
                return s
            }, 0)
            return sum + vendorItemsTotal
        }
        return sum + Number(order.totalAmount || order.total || 0)
    }, 0)

    const platformCommission = Number((totalRevenue * 0.1) || 0)
    const deliveredCount = paidOrders.filter((order) => order.status === 'delivered').length
    const orderCount = paidOrders.length
    const pageTitle = role === 'admin' ? 'Platform Revenue' : 'Store Revenue'
    const backPath = role === 'admin' ? '/super-admin' : '/vendor-admin'

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black tracking-tight">{pageTitle}</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            View revenue totals for today, this month, or this year. The totals are calculated from your current orders data.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {filterOptions.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFilter(key)}
                                className={cx(
                                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                                    filter === key
                                        ? 'border-violet-700 bg-violet-700 text-white'
                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800',
                                )}
                            >
                                <Icon size={16} /> {label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setConfirmClearOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Total revenue</p>
                                <button type="button" onClick={() => setShowRevenue(!showRevenue)} className="rounded-lg p-1.5 transition hover:bg-slate-200/50 dark:hover:bg-slate-800" title={showRevenue ? 'Hide revenue' : 'Show revenue'}>
                                    {showRevenue ? <Eye size={18} className="text-violet-700" /> : <EyeOff size={18} className="text-slate-400" />}
                                </button>
                            </div>
                            <p className="mt-4 text-4xl font-black tracking-tight">{showRevenue ? formatCurrency(totalRevenue) : '••••••'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Orders</p>
                            <p className="mt-4 text-4xl font-black tracking-tight">{orderCount}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Delivered</p>
                            <p className="mt-4 text-4xl font-black tracking-tight">{deliveredCount}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Platform commission (10%)</p>
                            <p className="mt-4 text-4xl font-black tracking-tight">{showRevenue ? formatCurrency(platformCommission) : '••••••'}</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black">Filtered orders</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Showing the most recent orders matching the selected range.</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total orders loaded: {orders.length}</p>
                        </div>

                        {loading || adminLoading ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                Loading orders…
                            </div>
                        ) : error ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/10 dark:text-red-200">
                                {error}
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                No orders found for the selected period.
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full table-auto text-left text-sm">
                                        <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                            <tr>
                                                <th className="px-4 py-3">Order</th>
                                                <th className="px-4 py-3">Buyer</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Commission</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {filteredOrders.slice(0, 10).map((order) => (
                                                <tr key={order._id || order.id}>
                                                    <td className="px-4 py-3 font-semibold">#{String(order._id || order.id || '').slice(-6).toUpperCase()}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order.buyer?.name || order.buyer?.email || 'Unknown'}</td>
                                                    {/* show vendor-specific amounts when role is vendor */}
                                                    <td className="px-4 py-3 font-black">
                                                        {formatCurrency(
                                                            role === 'vendor' && user && user._id
                                                                ? (order.items || []).reduce((s, it) => {
                                                                    const vendorId = it.vendor?._id || it.vendor
                                                                    if (!vendorId) return s
                                                                    if (String(vendorId) === String(user._id)) return s + Number(it.price || 0) * Number(it.quantity || 0)
                                                                    return s
                                                                }, 0)
                                                                : Number(order.totalAmount || order.total || 0)
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {formatCurrency(
                                                            role === 'vendor' && user && user._id
                                                                ? ((order.items || []).reduce((s, it) => {
                                                                    const vendorId = it.vendor?._id || it.vendor
                                                                    if (!vendorId) return s
                                                                    if (String(vendorId) === String(user._id)) return s + Number(it.price || 0) * Number(it.quantity || 0)
                                                                    return s
                                                                }, 0) * 0.1)
                                                                : (Number(order.totalAmount || order.total || 0) * 0.1)
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{order.status || 'pending'}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(order.createdAt || order.date || Date.now()).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Transaction history (paid orders) */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-black">Transaction History</h3>
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="min-w-full table-auto text-left text-sm">
                                            <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                                <tr>
                                                    <th className="px-4 py-3">Order</th>
                                                    <th className="px-4 py-3">Buyer</th>
                                                    <th className="px-4 py-3">Amount</th>
                                                    <th className="px-4 py-3">Commission (10%)</th>
                                                    <th className="px-4 py-3">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                {paidOrders.map((o) => (
                                                    <tr key={`tx-${o._id}`}>
                                                        <td className="px-4 py-3 font-semibold">#{String(o._id || o.id || '').slice(-6).toUpperCase()}</td>
                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.buyer?.name || o.buyer?.email || 'Unknown'}</td>
                                                        <td className="px-4 py-3 font-black">
                                                            {formatCurrency(
                                                                role === 'vendor' && user && user._id
                                                                    ? (o.items || []).reduce((s, it) => {
                                                                        const vendorId = it.vendor?._id || it.vendor
                                                                        if (!vendorId) return s
                                                                        if (String(vendorId) === String(user._id)) return s + Number(it.price || 0) * Number(it.quantity || 0)
                                                                        return s
                                                                    }, 0)
                                                                    : Number(o.totalAmount || o.total || 0)
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold">
                                                            {formatCurrency(
                                                                role === 'vendor' && user && user._id
                                                                    ? ((o.items || []).reduce((s, it) => {
                                                                        const vendorId = it.vendor?._id || it.vendor
                                                                        if (!vendorId) return s
                                                                        if (String(vendorId) === String(user._id)) return s + Number(it.price || 0) * Number(it.quantity || 0)
                                                                        return s
                                                                    }, 0) * 0.1)
                                                                    : (Number(o.totalAmount || o.total || 0) * 0.1)
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(o.createdAt || o.date || Date.now()).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={confirmClearOpen}
                title="Clear all revenue history"
                description="This will remove all revenue history and orders from the page. Do you want to continue?"
                confirmLabel="Clear all"
                cancelLabel="Cancel"
                loading={false}
                onConfirm={clearAll}
                onCancel={() => setConfirmClearOpen(false)}
            />
        </div>
    )
}
