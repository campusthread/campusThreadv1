import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useLazyVerifyPaymentQuery } from '../redux/slices/orderApiSlice'

const NAV_LINKS = [
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function PaymentSuccess() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const { notifications } = useNotification()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying payment...')
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)
  const [verifyPayment] = useLazyVerifyPaymentQuery()
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setError('Payment reference not found. Please return to your orders or try again.')
      setStatus(null)
      return
    }

    const verify = async () => {
      try {
        const response = await verifyPayment(reference).unwrap()
        setOrder(response.order)
        setStatus('Payment verified successfully!')
      } catch (err) {
        setError(err.message || 'Payment verification failed. Please contact support.')
        setStatus(null)
      }
    }

    verify()
  }, [searchParams, verifyPayment])

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className={cx('rounded-2xl border p-8 text-center shadow-lg', surfaceClass)}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            {status ? <Loader2 className="animate-spin" size={30} /> : error ? <XCircle size={30} /> : <CheckCircle2 size={30} />}
          </div>
          <h1 className="text-3xl font-black tracking-normal">Payment Status</h1>
          {status && <p className={cx('mt-4 font-semibold', mutedText)}>{status}</p>}
          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          {!user && error && (
            <Link to="/auth" className="mt-5 inline-flex rounded-lg border border-violet-700 px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50">
              Login to verify payment
            </Link>
          )}
          {order && (
            <div className={cx('mt-6 rounded-xl border p-5 text-left', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
              <p><strong>Order:</strong> {order.orderNumber}</p>
              <p className="mt-2"><strong>Amount:</strong> NGN {order.totalAmount?.toLocaleString()}</p>
              <p className="mt-2"><strong>Status:</strong> {order.paymentStatus}</p>
              <p className="mt-2"><strong>Order status:</strong> {order.status}</p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800" onClick={() => navigate('/orders')}>View Orders</button>
            <Link to="/shop" className={cx('rounded-lg border px-5 py-3 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>Continue Shopping</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
