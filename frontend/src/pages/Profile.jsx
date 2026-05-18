import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ArrowLeft, IdCard, PenLine, Upload } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { setCredentials } from '../redux/slices/authSlice'
import {
  useUpdateUserProfileMutation,
  useUploadUserProfilePictureMutation,
} from '../redux/slices/userApiSlice'
import { useGetUserOrdersQuery } from '../redux/slices/orderApiSlice'

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
  const [uploadUserProfilePicture] = useUploadUserProfilePictureMutation()
  const [profileFile, setProfileFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    university: user?.university || '',
    brandName: user?.brandName || '',
    socialLink: user?.socialLink || '',
  })
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
      joined: new Date(user.createdAt || Date.now()).toLocaleDateString(),
    }
  }, [user])

  const syncUser = (nextUser) => {
    const token = localStorage.getItem('accessToken')
    localStorage.setItem('currentUser', JSON.stringify(nextUser))
    dispatch(setCredentials({ user: nextUser, token }))
  }

  const { data: orderData, isFetching: ordersLoading, error: ordersError } = useGetUserOrdersQuery(undefined, {
    skip: !user || user.role === 'vendor',
  })
  const orders = orderData?.orders || []

  const handleProfileSave = async () => {
    try {
      setSaving(true)
      let nextUser = user
      const profileResponse = await updateUserProfile(formData).unwrap()
      nextUser = { ...nextUser, ...profileResponse.user }

      if (profileFile) {
        const uploadResponse = await uploadUserProfilePicture(profileFile).unwrap()
        nextUser = { ...nextUser, ...uploadResponse.user }
        setProfileFile(null)
      }

      syncUser(nextUser)
      showNotification('Profile updated successfully!', 'success')
    } catch (error) {
      showNotification(error?.data?.message || error?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showNotification('Please choose a valid image file.', 'error')
      return
    }
    setProfileFile(file)
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
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt={profileData.name} className="h-24 w-24 rounded-full border-4 border-white object-cover" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full bg-violet-700 text-2xl font-black text-white">
                  {profileData.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
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
          </div>

          <aside className={cx('rounded-2xl border p-6 shadow-lg lg:col-span-2', surfaceClass)}>
            <h3 className="text-xl font-black tracking-normal">Account Details</h3>
            <div className="mt-5 grid gap-4">
              <label className={cx('rounded-xl border p-4', softClass)}>
                <span className={cx('flex items-center gap-2 text-sm font-bold', mutedText)}><Upload size={16} /> Profile Picture</span>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="mt-3 w-full text-sm" />
                {profileFile && <p className="mt-2 text-sm font-semibold">{profileFile.name}</p>}
              </label>
              <Field label="Full Name"><input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} className={inputClass} /></Field>
              <Field label="Phone"><input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} className={inputClass} /></Field>
              <Field label="University"><input value={formData.university} onChange={(event) => setFormData((prev) => ({ ...prev, university: event.target.value }))} className={inputClass} /></Field>
              {user?.role === 'vendor' ? (
                <>
                  <Field label="Store / Brand Name"><input value={formData.brandName} onChange={(event) => setFormData((prev) => ({ ...prev, brandName: event.target.value }))} className={inputClass} /></Field>
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

        {user?.role !== 'vendor' && (
          <section className={cx('mt-10 rounded-2xl border p-6 shadow-lg', surfaceClass)}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-normal">Recent Orders</h2>
                <p className={cx('mt-2 text-sm', mutedText)}>Your latest buyer order history is shown here.</p>
              </div>
              <Link
                to="/orders"
                className={cx(
                  'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-500/20',
                  isDark
                    ? 'border-white/10 bg-slate-900 text-slate-100 hover:bg-white/5'
                    : 'border-slate-200 bg-white text-slate-950 hover:bg-violet-100'
                )}
              >
                View full order history
              </Link>
            </div>

            {ordersLoading && <p className={mutedText}>Loading order history...</p>}
            {ordersError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {ordersError?.data?.message || ordersError?.error || 'Unable to load orders.'}
              </div>
            )}

            {!ordersLoading && orders.length === 0 ? (
              <div className={cx('rounded-2xl border-2 border-dashed p-10 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
                <p className="text-lg font-bold">No orders yet</p>
                <p className="mt-2 text-sm">Once you place an order, it will appear here in your profile.</p>
              </div>
            ) : (
              orders.length > 0 && (
                <div className="overflow-hidden rounded-2xl border shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className={isDark ? 'bg-slate-950' : 'bg-slate-100'}>
                        <tr>
                          {['Order', 'Product', 'Amount', 'Status', 'Payment', 'Date / Time'].map((head) => (
                            <th key={head} className="px-5 py-4 font-black">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {orders.map((order) => {
                          const created = new Date(order.createdAt)
                          const dateText = created.toLocaleDateString()
                          const timeText = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          const productNames = order.items?.map((item) => item.name).filter(Boolean)
                          return (
                            <tr key={order._id}>
                              <td className="px-5 py-4">
                                <strong>{order.orderNumber || order._id.slice(-6).toUpperCase()}</strong>
                                <div className={cx('mt-1', mutedText)}>{order.items?.length || 0} item(s)</div>
                              </td>
                              <td className="px-5 py-4 max-w-[240px]">
                                <div className={cx('text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-900')}>
                                  {productNames.length > 0 ? productNames[0] : 'No product name'}
                                </div>
                                {productNames.length > 1 && (
                                  <div className={cx('mt-1 text-xs', mutedText)}>
                                    +{productNames.length - 1} more
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4 font-bold">NGN {(order.totalAmount || 0).toLocaleString()}</td>
                              <td className="px-5 py-4"><StatusPill value={order.status} /></td>
                              <td className="px-5 py-4">
                                <div className={cx('font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>{order.paymentMethod?.toUpperCase() || 'Paystack'}</div>
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
          </section>
        )}
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
  return <span className={cx('rounded-full px-3 py-1 text-xs font-black uppercase', tone)}>{value}</span>
}
