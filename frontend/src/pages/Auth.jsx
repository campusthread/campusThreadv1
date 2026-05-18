import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ShoppingBag, Store, UserPlus } from 'lucide-react'
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
  const [signinLoading, setSigninLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('customer')
  const [signupStep, setSignupStep] = useState('role')
  const [signupData, setSignupData] = useState({
    name: '', email: '', phone: '', university: '',
    brandName: '', socialLink: '', password: '', confirmPassword: '',
  })
  const [signupLoading, setSignupLoading] = useState(false)
  const [agreeTOS, setAgreeTOS] = useState(false)
  const [showSignupPass, setShowSignupPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const { login, register } = useAuth()
  const { openPolicy } = usePolicyModal()
  const isDark = theme === 'dark'
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx('mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')

  const passwordRequirements = [
    { label: 'At least 8 characters', validator: (value) => value.length >= 8 },
    { label: 'Uppercase letter', validator: (value) => /[A-Z]/.test(value) },
    { label: 'Lowercase letter', validator: (value) => /[a-z]/.test(value) },
    { label: 'Special character', validator: (value) => /[^A-Za-z0-9]/.test(value) },
  ]

  const signupPasswordCriteria = passwordRequirements.map((requirement) => ({
    ...requirement,
    valid: requirement.validator(signupData.password),
  }))

  const passwordStrength = (() => {
    const validCount = signupPasswordCriteria.filter((item) => item.valid).length
    if (validCount <= 1) return { label: 'Weak', color: 'bg-rose-500' }
    if (validCount === 2) return { label: 'Fair', color: 'bg-amber-500' }
    if (validCount === 3) return { label: 'Good', color: 'bg-sky-500' }
    return { label: 'Strong', color: 'bg-emerald-500' }
  })()

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
    setAlert(null)
    if (!signinEmail.trim() || !signinPassword) {
      showAlert('Please fill in all fields', 'error')
      return
    }

    setSigninLoading(true)
    try {
      const response = await login(signinEmail, signinPassword)
      if (rememberMe) localStorage.setItem('rememberEmail', signinEmail)
      else localStorage.removeItem('rememberEmail')
      showAlert('Sign in successful! Redirecting...', 'success')
      setTimeout(() => navigate(response.user?.role === 'vendor' ? '/vendor-admin' : '/shop'), 1500)
    } catch (err) {
      showAlert(err.message || 'Invalid email or password', 'error')
    } finally {
      setSigninLoading(false)
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    setAlert(null)
    const { name, email, phone, university, password, confirmPassword, brandName, socialLink } = signupData

    if (!name.trim() || !email.trim() || !university.trim() || !password || !confirmPassword) {
      showAlert('Please fill in all required fields', 'error')
      return
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error')
      return
    }

    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error')
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      showAlert('Password must include uppercase, lowercase, and special characters', 'error')
      return
    }

    if (!agreeTOS) {
      showAlert('You must agree to the Terms of Service', 'error')
      return
    }

    if (selectedRole === 'vendor' && (!brandName.trim() || !socialLink.trim())) {
      showAlert('Please fill in all vendor fields', 'error')
      return
    }

    setSignupLoading(true)
    try {
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
      setSignupLoading(false)
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
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-violet-700" />
                  Remember me
                </label>
                <div className="text-right text-sm">
                  <Link to="/forgot-password" className="font-bold text-violet-700 underline">Forgot password?</Link>
                </div>
              </div>
              <button type="submit" disabled={signinLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
                <LogIn size={18} />
                {signinLoading ? 'Signing in...' : 'Sign In'}
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Password strength</p>
                  <span className={cx('rounded-full px-2 py-1 text-xs font-bold', passwordStrength.color, 'text-white')}>{passwordStrength.label}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={cx('h-full rounded-full', passwordStrength.color)} style={{ width: `${(signupPasswordCriteria.filter((item) => item.valid).length / signupPasswordCriteria.length) * 100}%` }} />
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  {signupPasswordCriteria.map(({ label, valid }) => (
                    <div key={label} className={cx('flex items-center gap-2', valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400')}>
                      <span className={cx('h-3 w-3 rounded-full border', valid ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400 bg-transparent')} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
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
              <button type="submit" disabled={signupLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
                <UserPlus size={18} />
                {signupLoading ? 'Creating account...' : 'Create Account'}
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
