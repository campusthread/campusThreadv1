import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, CalendarDays, Clock3, Eye, EyeOff, Layers, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ConfirmModal from '../components/ConfirmModal'
import { useGetAllOrdersQuery } from '../redux/slices/adminApiSlice'

const filterOptions = [
    { key: 'today', label: 'Today', icon: Clock3 },
    { key: 'weekly', label: 'Weekly', icon: BarChart3 },
    { key: 'monthly', label: 'Monthly', icon: CalendarDays },
    { key: 'yearly', label: 'Yearly', icon: Layers },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')
const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
const COMMISSION_RATE = 0.10

function isSameDay(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDate() === dateB.getDate()
}

function isSameWeek(dateA, dateB) {
    const dayA = dateA.getDate() - dateA.getDay()
    const dayB = dateB.getDate() - dateB.getDay()
    return isSameMonth(dateA, dateB) && Math.floor(dayA / 7) === Math.floor(dayB / 7)
}

function isSameMonth(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth()
}

export default function SuperAdminCommission() {
    const navigate = useNavigate()
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [filter, setFilter] = useState('monthly')
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showRevenue, setShowRevenue] = useState(() => {
        const saved = localStorage.getItem('dashboardShowRevenue')
        return saved === 'false' ? false : true
    })
    const [isCleared, setIsCleared] = useState(false)
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)

    const { data: ordersData, isLoading: ordersLoading, isError: ordersError } = useGetAllOrdersQuery({ page: 1, limit: 500 })

    useEffect(() => {
        localStorage.setItem('dashboardShowRevenue', showRevenue)
    }, [showRevenue])

    useEffect(() => {
        if (ordersLoading) return
        if (ordersError) {
            setError('Unable to load orders')
            setLoading(false)
            return
        }
        if (!isCleared) {
            setOrders(ordersData?.orders || [])
        }
        setLoading(false)
    }, [ordersError, ordersLoading, ordersData, isCleared])

    const clearAll = () => {
        setOrders([])
        setFilter('monthly')
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
            if (filter === 'weekly') return isSameWeek(created, now)
            if (filter === 'monthly') return isSameMonth(created, now)
            if (filter === 'yearly') return created.getFullYear() === now.getFullYear()
            return true
        })
    }, [orders, filter])

    const commissionBreakdown = useMemo(() => {
        const breakdown = filteredOrders.map((order) => {
            const orderTotal = Number(order.totalAmount || order.total || 0)
            const commissionAmount = orderTotal * COMMISSION_RATE
            return {
                ...order,
                orderTotal,
                commissionAmount,
            }
        })
        return breakdown
    }, [filteredOrders])

    const totalRevenue = commissionBreakdown.reduce((sum, item) => sum + item.commissionAmount, 0)
    const totalPlatformRevenue = commissionBreakdown.reduce((sum, item) => sum + item.orderTotal, 0)
    const orderCount = commissionBreakdown.length

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate('/super-admin')}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black tracking-tight">SuperAdmin Commission Revenue</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            CampusThread collects a <strong>10% commission</strong> on every product sold. View the breakdown by period.
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

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">SuperAdmin Commission</p>
                                <button type="button" onClick={() => setShowRevenue(!showRevenue)} className="rounded-lg p-1.5 transition hover:bg-slate-200/50 dark:hover:bg-slate-800" title={showRevenue ? 'Hide revenue' : 'Show revenue'}>
                                    {showRevenue ? <Eye size={18} className="text-violet-700" /> : <EyeOff size={18} className="text-slate-400" />}
                                </button>
                            </div>
                            <p className="mt-4 text-4xl font-black tracking-tight">{showRevenue ? formatCurrency(totalRevenue) : '••••••'}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">10% of all orders</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Platform Revenue</p>
                                <button type="button" onClick={() => setShowRevenue(!showRevenue)} className="rounded-lg p-1.5 transition hover:bg-slate-200/50 dark:hover:bg-slate-800" title={showRevenue ? 'Hide revenue' : 'Show revenue'}>
                                    {showRevenue ? <Eye size={18} className="text-violet-700" /> : <EyeOff size={18} className="text-slate-400" />}
                                </button>
                            </div>
                            <p className="mt-4 text-4xl font-black tracking-tight">{showRevenue ? formatCurrency(totalPlatformRevenue) : '••••••'}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total from orders</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">Orders</p>
                            <p className="mt-4 text-4xl font-black tracking-tight">{orderCount}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total orders</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black">Commission breakdown</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Showing the 10% commission earned from each order.</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total orders loaded: {orders.length}</p>
                        </div>

                        {loading ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                Loading orders…
                            </div>
                        ) : error ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/10 dark:text-red-200">
                                {error}
                            </div>
                        ) : commissionBreakdown.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                No orders found for the selected period.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto text-left text-sm">
                                    <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                        <tr>
                                            <th className="px-4 py-3">Order ID</th>
                                            <th className="px-4 py-3">Vendor</th>
                                            <th className="px-4 py-3">Order Total</th>
                                            <th className="px-4 py-3">Commission (10%)</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {commissionBreakdown.slice(0, 20).map((item) => (
                                            <tr key={item._id || item.id}>
                                                <td className="px-4 py-3 font-semibold">#{String(item._id || item.id || '').slice(-6).toUpperCase()}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {item.items?.[0]?.vendor?.brandName || 'Unknown vendor'}
                                                </td>
                                                <td className="px-4 py-3 font-semibold">{formatCurrency(item.orderTotal)}</td>
                                                <td className="px-4 py-3 font-black text-violet-700">{formatCurrency(item.commissionAmount)}</td>
                                                <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{item.status || 'pending'}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {new Date(item.createdAt || item.date || Date.now()).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={confirmClearOpen}
                title="Clear all commission history"
                description="This will remove all commission history and orders from the page. Do you want to continue?"
                confirmLabel="Clear all"
                cancelLabel="Cancel"
                loading={false}
                onConfirm={clearAll}
                onCancel={() => setConfirmClearOpen(false)}
            />
        </div>
    )
}
