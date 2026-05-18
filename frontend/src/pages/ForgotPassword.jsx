import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'
import { usePolicyModal } from '../context/PolicyContext'
import { authAPI } from '../utils/api'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function ForgotPassword() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [alert, setAlert] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { openPolicy } = usePolicyModal()
  const isDark = theme === 'dark'
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const showAlert = (message, type) => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAlert(null)
    if (!email.trim()) {
      showAlert('Please enter your email address', 'error')
      return
    }

    setIsLoading(true)
    try {
      await authAPI.forgotPassword(email.trim())
      showAlert('If that email exists, a reset link has been sent.', 'success')
      setEmail('')
    } catch (err) {
      showAlert(err.message || 'Unable to send reset link', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={[{ path: '/', label: 'Home' }, { path: '/shop', label: 'Shop' }, { path: '/explore', label: 'Explore' }, { path: '/auth', label: 'Sign In / Sign Up' }]} />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <section className={cx('rounded-2xl border p-6 shadow-lg sm:p-8', surfaceClass)}>
          <div className="text-center">
            <Link to="/" className="text-2xl font-black uppercase tracking-normal text-violet-700">
              Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
            </Link>
            <p className={cx('mt-3 text-sm', mutedText)}>Enter your account email to receive a secure password reset link.</p>
          </div>

          {alert && (
            <div className={cx('mt-5 rounded-xl border px-4 py-3 text-sm font-semibold', alert.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
            <label className="block">
              <span className="text-sm font-bold">Email Address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
            <div className="text-center text-sm text-slate-500">
              Back to{' '}
              <button type="button" onClick={() => navigate('/auth')} className="font-bold text-violet-700 underline">
                sign in
              </button>
            </div>
            <p className="text-center text-sm text-slate-500">
              Need help? Read our{' '}
              <button type="button" onClick={() => openPolicy('privacy')} className="font-bold text-violet-700 underline">
                privacy policy
              </button>
              .
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
