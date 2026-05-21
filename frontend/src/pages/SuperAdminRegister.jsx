import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, ShieldCheck, Sun, UserPlus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { usePolicyModal } from '../context/PolicyContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function SuperAdminRegister() {
  const { theme, toggleTheme } = useTheme()
  const { openPolicy } = usePolicyModal()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', university: '', department: '', password: '', confirmPassword: '' })
  const [terms, setTerms] = useState(false)
  const [alert, setAlert] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [strength, setStrength] = useState({ width: '0%', label: 'Weak', color: 'bg-red-600' })
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const calcStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++
    const map = [
      { widthClass: 'w-1/4', label: 'Weak', color: 'bg-red-600' },
      { widthClass: 'w-1/4', label: 'Weak', color: 'bg-red-600' },
      { widthClass: 'w-1/2', label: 'Fair', color: 'bg-amber-500' },
      { widthClass: 'w-3/4', label: 'Good', color: 'bg-sky-500' },
      { widthClass: 'w-full', label: 'Strong', color: 'bg-emerald-600' },
    ]
    setStrength(map[score])
  }

  const showAlert = (msg, type) => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { name, email, phone, university, department, password, confirmPassword } = form
    if (!name || !email || !phone || !university || !department || !password || !confirmPassword) return showAlert('Please fill in all fields', 'error')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert('Please enter a valid email address', 'error')
    if (password.length < 8) return showAlert('Password must be at least 8 characters long', 'error')
    if (password !== confirmPassword) return showAlert('Passwords do not match', 'error')
    if (!terms) return showAlert('You must agree to the Terms and Conditions', 'error')

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          phone,
          university,
          department,
          password,
          role: 'admin'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return showAlert(data.message || 'Registration failed', 'error')
      }

      showAlert('Super admin account created successfully! Redirecting to login...', 'success')
      setTimeout(() => navigate('/super-admin-login'), 2000)
    } catch (err) {
      showAlert(err.message || 'An error occurred during registration', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cx('grid min-h-screen place-items-center px-4 py-10', pageClass)}>
      <button type="button" onClick={toggleTheme} className={cx('fixed right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow', isDark ? 'border-white/10 bg-slate-900 text-amber-200' : 'border-slate-200 bg-white text-slate-700')}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className={cx('w-full max-w-2xl rounded-2xl border p-8 shadow-xl', surfaceClass)}>
        <div className="text-center">
          <Link to="/" className="block text-2xl font-black uppercase text-violet-700">
            Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
          </Link>
          <h1 className="mt-5 text-3xl font-black tracking-normal">Create Super Admin Account</h1>
          <p className={cx('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>Fill in the details below to create a new account.</p>
        </div>

        {alert && <div className={cx('mt-5 rounded-xl border px-4 py-3 text-sm font-semibold', alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>{alert.msg}</div>}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <Field label="Full Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required disabled={isLoading} className={inputClass} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email Address"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required disabled={isLoading} className={inputClass} /></Field>
            <Field label="Phone Number"><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required disabled={isLoading} className={inputClass} /></Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="University"><input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} required disabled={isLoading} className={inputClass} /></Field>
            <Field label="Department">
              <select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required disabled={isLoading} className={inputClass}>
                <option value="">Select a department</option>
                {[['admin', 'Administration'], ['finance', 'Finance'], ['academic', 'Academic'], ['student-affairs', 'Student Affairs'], ['it', 'IT Support'], ['other', 'Other']].map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Password">
            <input type="password" value={form.password} onChange={(event) => { setForm({ ...form, password: event.target.value }); calcStrength(event.target.value) }} required disabled={isLoading} className={inputClass} />
            <div className="mt-3 h-1 overflow-hidden rounded bg-slate-200">
              <div className={`h-full ${strength.widthClass || 'w-0'} ${strength.color}`} />
            </div>
            <p className="mt-2 text-sm">Password strength: <strong>{strength.label}</strong></p>
          </Field>
          <Field label="Confirm Password"><input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required disabled={isLoading} className={inputClass} /></Field>
          <label className={cx('flex items-start gap-2 rounded-xl border p-4 text-sm', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} required disabled={isLoading} className="mt-1 h-4 w-4 accent-violet-700" />
            <span>
              I agree to the{' '}
              <button type="button" onClick={() => openPolicy('terms')} className="font-bold text-violet-700 underline">Terms and Conditions</button>
              {' '}and{' '}
              <button type="button" onClick={() => openPolicy('privacy')} className="font-bold text-violet-700 underline">Privacy Policy</button>
            </span>
          </label>
          <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed">
            <UserPlus size={18} />
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">Already have an account? <Link to="/super-admin-login" className="font-bold text-violet-700">Sign In</Link></p>
        <div className={cx('mt-6 flex gap-3 rounded-xl border p-4 text-sm', isDark ? 'border-sky-300/20 bg-sky-300/10 text-sky-100' : 'border-sky-200 bg-sky-50 text-sky-800')}>
          <ShieldCheck size={18} className="shrink-0" />
          <p>This registration portal is restricted to authorized super admin personnel only.</p>
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
