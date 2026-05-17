import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn, ShoppingBag, Store, UserPlus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { usePolicyModal } from '../context/PolicyContext'

const authLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore' },
  { path: '/auth', label: 'Sign In / Sign Up' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Auth() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('signin')
  const [alert, setAlert] = useState(null)
  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showSigninPass, setShowSigninPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('customer')
  const [signupStep, setSignupStep] = useState('role')
  const [signupData, setSignupData] = useState({
    name: '', email: '', phone: '', university: '',
    brandName: '', socialLink: '', password: '', confirmPassword: '',
  })
  const [agreeTOS, setAgreeTOS] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [showSignupPass, setShowSignupPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const { login, register } = useAuth()
  const { openPolicy } = usePolicyModal()
  const isDark = theme === 'dark'
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  useEffect(() => {
    const remembered = localStorage.getItem('rememberEmail')
    if (remembered) {
      setSigninEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const showAlert = (message, type) => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleSignIn = async (event) => {
    event.preventDefault()
    if (!signinEmail || !signinPassword) {
      showAlert('Please fill in all fields', 'error')
      return
    }

    try {
      setAuthLoading(true)
      const response = await login(signinEmail, signinPassword)
      if (rememberMe) localStorage.setItem('rememberEmail', signinEmail)
      else localStorage.removeItem('rememberEmail')
      showAlert('Sign in successful! Redirecting...', 'success')
      setTimeout(() => navigate(response.user?.role === 'vendor' ? '/vendor-admin' : '/shop'), 1500)
    } catch (err) {
      showAlert(err.message || 'Invalid email or password', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    const { name, email, phone, university, password, confirmPassword, brandName, socialLink } = signupData
    if (!name || !email || !university || !password || !confirmPassword) return showAlert('Please fill in all required fields', 'error')
    if (password !== confirmPassword) return showAlert('Passwords do not match', 'error')
    if (password.length < 6) return showAlert('Password must be at least 6 characters', 'error')
    if (!agreeTOS) return showAlert('You must agree to the Terms of Service', 'error')
    if (selectedRole === 'vendor' && (!brandName || !socialLink)) return showAlert('Please fill in all vendor fields', 'error')

    try {
      setAuthLoading(true)
      const response = await register({
        name,
        email,
        phone,
        university,
        password,
        role: selectedRole,
        brandName: selectedRole === 'vendor' ? brandName : undefined,
        socialLink: selectedRole === 'vendor' ? socialLink : undefined,
      })
      showAlert('Account created successfully! Redirecting...', 'success')
      setTimeout(() => navigate(response.user?.role === 'vendor' ? '/vendor-admin' : '/shop'), 1500)
    } catch (err) {
      showAlert(err.message || 'Registration failed', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={authLinks} />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <section className={cx('rounded-2xl border p-6 shadow-lg sm:p-8', surfaceClass)}>
          <div className="text-center">
            <Link to="/" className="text-2xl font-black uppercase tracking-normal text-violet-700">
              Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
            </Link>
            <p className={cx('mt-3 text-sm', mutedText)}>Sign in or create your campus marketplace account.</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-white/10">
            {[
              { key: 'signin', label: 'Sign In', icon: LogIn },
              { key: 'signup', label: 'Sign Up', icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key)
                  setAlert(null)
                  setSignupStep('role')
                }}
                className={cx('inline-flex items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition', activeTab === key ? 'border-violet-700 text-violet-700' : 'border-transparent text-slate-500 hover:text-violet-700')}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {alert && (
            <div className={cx('mt-5 rounded-xl border px-4 py-3 text-sm font-semibold', alert.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : alert.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700')}>
              {alert.message}
            </div>
          )}

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="mt-6 grid gap-5">
              <Field label="Email Address"><input type="email" placeholder="you@example.com" value={signinEmail} onChange={(event) => setSigninEmail(event.target.value)} required className={inputClass} /></Field>
              <PasswordField label="Password" value={signinPassword} show={showSigninPass} setShow={setShowSigninPass} onChange={setSigninPassword} inputClass={inputClass} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-violet-700" />
                Remember me
              </label>
              <button type="submit" disabled={authLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70">
                {authLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {authLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <p className={cx('text-center text-sm', mutedText)}>
                Don&apos;t have an account? <button type="button" onClick={() => setActiveTab('signup')} className="font-bold text-violet-700 underline">Sign up here</button>
              </p>
            </form>
          ) : signupStep === 'role' ? (
            <div className="mt-6">
              <h3 className="text-xl font-black tracking-normal">What's your role?</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { value: 'customer', icon: ShoppingBag, label: 'Buyer', desc: 'Shop for campus apparel' },
                  { value: 'vendor', icon: Store, label: 'Vendor', desc: 'Sell your products' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRole(value)}
                    className={cx('rounded-xl border p-5 text-center transition', selectedRole === value ? 'border-violet-700 bg-violet-50 text-violet-700' : isDark ? 'border-white/10 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700')}
                  >
                    <Icon size={34} className="mx-auto" />
                    <strong className="mt-3 block">{label}</strong>
                    <span className="mt-1 block text-sm">{desc}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="mt-5 w-full rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800" onClick={() => setSignupStep('form')}>
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="mt-6 grid gap-5">
              <button type="button" className="w-fit rounded-lg border border-violet-700 px-3 py-2 text-sm font-bold text-violet-700" onClick={() => setSignupStep('role')}>
                Back to role
              </button>
              {[
                ['name', 'Full Name', 'text', 'John Doe', true],
                ['email', 'Email Address', 'email', 'you@example.com', true],
                ['phone', 'Phone Number', 'tel', '+234 (0) 123 456 7890', false],
                ['university', 'University/Institution', 'text', 'Your university name', true],
              ].map(([key, label, type, placeholder, required]) => (
                <Field key={key} label={label}>
                  <input type={type} placeholder={placeholder} value={signupData[key]} onChange={(event) => setSignupData({ ...signupData, [key]: event.target.value })} required={required} className={inputClass} />
                </Field>
              ))}
              {selectedRole === 'vendor' && (
                <>
                  <Field label="Brand/Shop Name"><input value={signupData.brandName} onChange={(event) => setSignupData({ ...signupData, brandName: event.target.value })} required className={inputClass} /></Field>
                  <Field label="Social Media / DM Link"><input value={signupData.socialLink} onChange={(event) => setSignupData({ ...signupData, socialLink: event.target.value })} required className={inputClass} /></Field>
                </>
              )}
              <PasswordField label="Password" value={signupData.password} show={showSignupPass} setShow={setShowSignupPass} onChange={(value) => setSignupData({ ...signupData, password: value })} inputClass={inputClass} />
              <PasswordField label="Confirm Password" value={signupData.confirmPassword} show={showConfirmPass} setShow={setShowConfirmPass} onChange={(value) => setSignupData({ ...signupData, confirmPassword: value })} inputClass={inputClass} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={agreeTOS} onChange={(event) => setAgreeTOS(event.target.checked)} required className="mt-1 h-4 w-4 accent-violet-700" />
                <span>
                  I agree to the{' '}
                  <button type="button" onClick={() => openPolicy('terms')} className="font-bold text-violet-700 underline">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => openPolicy('privacy')} className="font-bold text-violet-700 underline">Privacy Policy</button>
                </span>
              </label>
              <button type="submit" disabled={authLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70">
                {authLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                {authLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
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

function PasswordField({ label, value, show, setShow, onChange, inputClass }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} required className={cx(inputClass, 'pr-11')} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}
