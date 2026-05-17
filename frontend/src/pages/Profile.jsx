import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ArrowLeft, IdCard, PenLine } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useGetUserOrdersQuery, useGetVendorOrdersQuery } from '../redux/slices/orderApiSlice'
import { setCredentials } from '../redux/slices/authSlice'
import {
  useUpdateUserProfileMutation,
} from '../redux/slices/userApiSlice'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Profile() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications, showNotification } = useNotification()
  const { user } = useAuth()
  const dispatch = useDispatch()
  const [updateUserProfile] = useUpdateUserProfileMutation()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    university: user?.university || '',
    brandName: user?.brandName || '',
    socialLink: user?.socialLink || '',
    bankName: user?.bankName || '',
    accountNumber: user?.accountNumber || '',
    accountHolderName: user?.accountHolderName || user?.name || '',
  })
  const [formErrors, setFormErrors] = useState({})
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const softClass = isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const profileData = useMemo(() => {
    if (!user) return {}
    return {
      name: user.name || 'Guest User',
      email: user.email || 'Not available',
      role: user.role || 'customer',
      university: user.university || 'Not specified',
      phone: user.phone || 'Not specified',
      profileImage: user.profileImage || user.storeImage || '',
      brandName: user.brandName || user.storeName || 'Not available',
      socialLink: user.socialLink || user.website || 'Not available',
      bankName: user.bankName || 'Not set',
      accountNumber: user.accountNumber || 'Not set',
      accountHolderName: user.accountHolderName || 'Not set',
      joined: new Date(user.createdAt || Date.now()).toLocaleDateString(),
    }
  }, [user])

  // Orders (show recent orders on profile)
  const isVendor = user?.role === 'vendor'
  const vendorQuery = useGetVendorOrdersQuery(undefined, { skip: !isVendor })
  const userQuery = useGetUserOrdersQuery(undefined, { skip: isVendor || !user })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  useEffect(() => {
    const response = isVendor ? vendorQuery.data : userQuery.data
    const requestError = isVendor ? vendorQuery.error : userQuery.error
    const requestLoading = isVendor ? vendorQuery.isFetching : userQuery.isFetching

    setOrdersLoading(requestLoading)
    if (response?.orders) {
      setOrders(response.orders.slice(0, 5))
      setOrdersError(null)
      return
    }
    if (requestError) setOrdersError(requestError?.data?.message || requestError?.error || 'Unable to load orders')
  }, [isVendor, userQuery.data, userQuery.error, userQuery.isFetching, vendorQuery.data, vendorQuery.error, vendorQuery.isFetching])

  const validateProfile = () => {
    const errors = {}

    if (user?.role === 'vendor') {
      if (!formData.bankName.trim()) {
        errors.bankName = 'Bank name is required for payout updates.'
      }
      if (!formData.accountHolderName.trim()) {
        errors.accountHolderName = 'Account holder name is required.'
      }
      const accountNumber = formData.accountNumber.trim()
      if (!accountNumber) {
        errors.accountNumber = 'Account number is required.'
      } else if (!/^\d{8,20}$/.test(accountNumber)) {
        errors.accountNumber = 'Account number must be 8–20 digits.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const syncUser = (nextUser) => {
    const token = localStorage.getItem('accessToken')
    localStorage.setItem('currentUser', JSON.stringify(nextUser))
    dispatch(setCredentials({ user: nextUser, token }))
  }

  const handleProfileSave = async () => {
    if (!validateProfile()) {
      return
    }

    try {
      setSaving(true)
      let nextUser = user
      const profileResponse = await updateUserProfile(formData).unwrap()
      nextUser = { ...nextUser, ...profileResponse.user }

      syncUser(nextUser)
      showNotification('Profile updated successfully!', 'success')
    } catch (error) {
      showNotification(error?.data?.message || error?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className={cx('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
              <IdCard size={14} />
              Account profile
            </p>
            <h1 className="text-4xl font-black tracking-normal sm:text-5xl">My Profile</h1>
            <p className={cx('mt-3 max-w-2xl leading-7', mutedText)}>Manage your account details, view your role, and keep your campus profile up to date.</p>
          </div>
          <Link to="/shop" className={cx('inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className={cx('rounded-2xl border p-6 shadow-lg lg:col-span-3', surfaceClass)}>
            <div className="mb-6 flex items-center gap-5">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-violet-700 text-2xl font-black text-white">
                {profileData.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-normal">{profileData.name}</h2>
                <p className={mutedText}>{profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1)}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Email', profileData.email],
                ['University', profileData.university],
                ['Phone', profileData.phone],
                ['Member since', profileData.joined],
              ].map(([label, value]) => (
                <div key={label} className={cx('rounded-xl border p-4', softClass)}>
                  <p className={cx('text-xs font-black uppercase tracking-wide', mutedText)}>{label}</p>
                  <p className="mt-2 font-bold">{value}</p>
                </div>
              ))}
            </div>
            {isVendor && (
              <div className={cx('mt-6 rounded-xl border p-4', softClass)}>
                <h3 className="text-sm font-black uppercase tracking-wide text-violet-700">Vendor payout details</h3>
                <div className={cx('mt-3 grid gap-3 text-sm', mutedText)}>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Account Holder</p>
                    <p className="mt-1 font-semibold">{profileData.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Bank</p>
                    <p className="mt-1 font-semibold">{profileData.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Account Number</p>
                    <p className="mt-1 font-semibold">{profileData.accountNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className={cx('rounded-2xl border p-6 shadow-lg lg:col-span-2', surfaceClass)}>
            <h3 className="text-xl font-black tracking-normal">Account Details</h3>
            <div className="mt-5 grid gap-4">
              <Field label="Full Name"><input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} className={inputClass} /></Field>
              <Field label="Phone"><input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} className={inputClass} /></Field>
              <Field label="University"><input value={formData.university} onChange={(event) => setFormData((prev) => ({ ...prev, university: event.target.value }))} className={inputClass} /></Field>
              {user?.role === 'vendor' ? (
                <>
                  <Field label="Store / Brand Name"><input value={formData.brandName} onChange={(event) => setFormData((prev) => ({ ...prev, brandName: event.target.value }))} className={inputClass} /></Field>
                  <Field label="Bank Name">
                    <input value={formData.bankName} onChange={(event) => { setFormData((prev) => ({ ...prev, bankName: event.target.value })); setFormErrors((prev) => ({ ...prev, bankName: undefined })) }} className={inputClass} />
                    {formErrors.bankName && <p className="mt-1 text-xs text-red-500">{formErrors.bankName}</p>}
                  </Field>
                  <Field label="Account Number">
                    <input value={formData.accountNumber} onChange={(event) => { setFormData((prev) => ({ ...prev, accountNumber: event.target.value })); setFormErrors((prev) => ({ ...prev, accountNumber: undefined })) }} className={inputClass} />
                    {formErrors.accountNumber && <p className="mt-1 text-xs text-red-500">{formErrors.accountNumber}</p>}
                  </Field>
                  <Field label="Account Holder">
                    <input value={formData.accountHolderName} onChange={(event) => { setFormData((prev) => ({ ...prev, accountHolderName: event.target.value })); setFormErrors((prev) => ({ ...prev, accountHolderName: undefined })) }} className={inputClass} />
                    {formErrors.accountHolderName && <p className="mt-1 text-xs text-red-500">{formErrors.accountHolderName}</p>}
                  </Field>
                  <Field label="Social Link"><input value={formData.socialLink} onChange={(event) => setFormData((prev) => ({ ...prev, socialLink: event.target.value }))} className={inputClass} /></Field>
                </>
              ) : (
                <>
                  <ReadOnly label="Role" value={profileData.role} softClass={softClass} mutedText={mutedText} />
                  <ReadOnly label="Store / Brand" value={profileData.brandName} softClass={softClass} mutedText={mutedText} />
                  <ReadOnly label="Social Link" value={profileData.socialLink} softClass={softClass} mutedText={mutedText} />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleProfileSave}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:opacity-60"
              disabled={saving}
            >
              <PenLine size={18} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </aside>
        </section>

        <section className="mt-8 lg:col-span-5">
          <h3 className="text-xl font-black tracking-normal">Recent Orders</h3>
          <div className="mt-4">
            {ordersLoading && <p className={mutedText}>Loading orders...</p>}
            {ordersError && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{ordersError}</div>}

            {orders.length === 0 && !ordersLoading ? (
              <div className={cx('rounded-2xl border-2 border-dashed p-8 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
                <p className="font-semibold">No recent orders.</p>
                <Link to="/shop" className="mt-4 inline-flex rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-800">Browse products</Link>
              </div>
            ) : (
              orders.length > 0 && (
                <div className={cx('overflow-hidden rounded-2xl border mt-4 shadow-lg', surfaceClass)}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}>
                        <tr>
                          {['Order', 'Amount', 'Status', 'Date'].map((head) => (
                            <th key={head} className="px-4 py-3 font-black">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-3">
                              <strong>{order.orderNumber || (order._id || '').slice(-6).toUpperCase()}</strong>
                              <div className={cx('mt-1', mutedText)}>{order.items?.length || 0} item(s)</div>
                            </td>
                            <td className="px-4 py-3 font-bold">NGN {(order.totalAmount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3"><StatusPill value={order.status} /></td>
                            <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 text-right">
                    <Link to="/orders" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition">View all orders</Link>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      {children}
    </label>
  )
}

function ReadOnly({ label, value, softClass, mutedText }) {
  return (
    <div className={cx('rounded-xl border p-4', softClass)}>
      <p className={cx('text-sm font-bold', mutedText)}>{label}</p>
      <p className="mt-1 font-bold">{value}</p>
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
