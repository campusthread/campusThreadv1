import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, ShoppingCart } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useGetCartQuery, useUpdateCartMutation } from '../redux/slices/cartFavoritesApiSlice'
import { useCreateOrderMutation, useInitializePaymentMutation } from '../redux/slices/orderApiSlice'

const NAV_LINKS = [
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Checkout() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const isLoggedIn = Boolean(user)
  const { notifications } = useNotification()
  const [shipping, setShipping] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [error, setError] = useState(null)
  const { data: cartData = [] } = useGetCartQuery()
  const [updateCart] = useUpdateCartMutation()
  const [createOrder] = useCreateOrderMutation()
  const [initializePayment] = useInitializePaymentMutation()
  const cart = Array.isArray(cartData) ? cartData : []
  const subTotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isLoggedIn) {
      setError('Please login before checking out.')
      navigate('/auth')
      return
    }

    if (cart.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setLoading(true)
    setError(null)

    const items = cart.map((item) => ({
      productId: item._id || item.id,
      quantity: item.quantity || 1,
    }))

    try {
      const response = await createOrder({
        items,
        shippingAddress: shipping,
        paymentMethod: 'paystack',
      }).unwrap()

      const order = response.order
      if (!order) throw new Error('Could not create order')

      const payment = await initializePayment({ orderId: order._id, email: user?.email }).unwrap()
      if (payment.authorization_url) {
        setOrderSuccess('Order created. Redirecting to payment...')
        window.location.href = payment.authorization_url
        return
      }

      setOrderSuccess('Order created successfully. Complete payment to finalize.')
      if (isLoggedIn) {
        await updateCart([]).unwrap()
      }
      setTimeout(() => navigate('/orders'), 2000)
    } catch (err) {
      console.error('Checkout error', err)
      const message = err?.data?.message || err?.error || err?.message || 'Checkout failed. Please try again.'
      if (message.includes('Unauthorized')) {
        setError('Please login before checking out.')
        navigate('/auth')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const shell = (children) => (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />
      {children}
      <Footer />
    </div>
  )

  if (cart.length === 0) {
    return shell(
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className={cx('rounded-2xl border-2 border-dashed p-12 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
          <ShoppingCart size={42} className="mx-auto mb-4" />
          <p className="text-lg font-bold">Your cart is empty.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
            Return to Shop
          </Link>
        </div>
      </main>,
    )
  }

  return shell(
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Checkout</h1>
          <p className={cx('mt-3 leading-7', mutedText)}>Review your cart and complete shipping information to place your order.</p>
        </div>
        <Link to="/cart" className={cx('inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
          <ArrowLeft size={16} />
          Back to Cart
        </Link>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {orderSuccess && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{orderSuccess}</div>}

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr]">
        <form onSubmit={handleSubmit} className={cx('rounded-2xl border p-6 shadow-lg sm:p-8', surfaceClass)}>
          <h2 className="text-2xl font-black tracking-normal">Shipping Information</h2>
          <div className="mt-6 grid gap-5">
            <Field label="Full Name"><input value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} required className={inputClass} /></Field>
            <Field label="Phone"><input type="tel" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} required className={inputClass} /></Field>
            <Field label="Address"><textarea value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} rows="4" required className={inputClass} /></Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City"><input value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} required className={inputClass} /></Field>
              <Field label="State"><input value={shipping.state} onChange={(event) => setShipping({ ...shipping, state: event.target.value })} required className={inputClass} /></Field>
              <Field label="ZIP / Postal Code"><input value={shipping.zipCode} onChange={(event) => setShipping({ ...shipping, zipCode: event.target.value })} required className={inputClass} /></Field>
            </div>
          </div>
          <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:opacity-60" type="submit" disabled={loading}>
            <CreditCard size={18} />
            {loading ? 'Placing order...' : 'Place Order'}
          </button>
        </form>

        <aside className={cx('h-fit rounded-2xl border p-6 shadow-lg', surfaceClass)}>
          <h2 className="text-2xl font-black tracking-normal">Order Summary</h2>
          <div className="mt-6 grid gap-4">
            {cart.map((item) => (
              <div key={item._id || item.id} className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className={cx('mt-1 text-sm', mutedText)}>Qty: {item.quantity || 1}</p>
                </div>
                <p className="font-black">NGN {((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-black text-violet-700 dark:border-white/10">
              <span>Total</span>
              <span>NGN {subTotal.toLocaleString()}</span>
            </div>
            <div className={cx('rounded-xl border p-4', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
              <p className={cx('text-sm', mutedText)}>Payment</p>
              <p className="mt-1 font-bold">Paystack integration</p>
            </div>
          </div>
        </aside>
      </div>
    </main>,
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
