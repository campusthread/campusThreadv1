import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useGetCurrentUserQuery } from '../redux/slices/authApiSlice'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function SuperAdminLogin() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const showError = (message) => {
    setLoginError(message)
    setTimeout(() => setLoginError(''), 4000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) return showError('Please enter both email and password')

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      let data
      const rawText = await response.text()
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        return showError(rawText || 'Login failed')
      }

      if (!response.ok) {
        return showError(data.message || 'Login failed')
      }

      const user = data?.user
      const token = data?.token

      // Check if user is admin
      if (user?.role !== 'admin') {
        return showError('Only admins can access this portal')
      }

      // Store user info for context
      localStorage.setItem('currentUser', JSON.stringify(user))
      if (token) {
        localStorage.setItem('accessToken', token)
      }
      window.dispatchEvent(new Event('campusThreadAuthUpdate'))

      navigate('/super-admin')
    } catch (err) {
      showError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cx('grid min-h-screen place-items-center px-4 py-10', pageClass)}>
      <button type="button" onClick={toggleTheme} className={cx('fixed right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow', isDark ? 'border-white/10 bg-slate-900 text-amber-200' : 'border-slate-200 bg-white text-slate-700')}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className={cx('w-full max-w-md rounded-2xl border p-8 shadow-xl', surfaceClass)}>
        <div className="text-center">
          <Link to="/" className="block text-2xl font-black uppercase text-violet-700">
            Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
          </Link>
          <h1 className="mt-5 text-3xl font-black tracking-normal">Super Admin Login</h1>
          <p className={cx('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>Enter your credentials to access the admin dashboard.</p>
        </div>

        {loginError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loginError}</div>}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <Field label="Email Address"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} required className={inputClass} /></Field>
          <Field label="Password">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading} required className={cx(inputClass, 'pr-11')} />
              <button type="button" onClick={() => setShowPass(!showPass)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={isLoading} className="h-4 w-4 accent-violet-700" />
              Remember me
            </label>
            <a href="#" className="font-bold text-violet-700">Forgot Password?</a>
          </div>
          <button type="submit" disabled={isLoading} className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition', isLoading ? 'bg-violet-600 cursor-not-allowed opacity-75' : 'bg-violet-700 hover:bg-violet-800')}>
            <Lock size={18} />
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don&apos;t have an account? <Link to="/super-admin-register" className="font-bold text-violet-700">Create one</Link>
        </p>

        <div className={cx('mt-6 flex gap-3 rounded-xl border p-4 text-sm', isDark ? 'border-sky-300/20 bg-sky-300/10 text-sky-100' : 'border-sky-200 bg-sky-50 text-sky-800')}>
          <ShieldCheck size={18} className="shrink-0" />
          <p>Only authorized super admins can access this portal.</p>
        </div>
      </section>
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
