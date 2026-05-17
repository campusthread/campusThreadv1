import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, UserCircle, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Navbar({ links = [] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const closeMenu = () => setMenuOpen(false)
  const linkClass = (path) =>
    cx(
      'rounded-md px-3 py-2 text-sm font-semibold transition',
      location.pathname === path
        ? 'bg-violet-700 text-white'
        : isDark
          ? 'text-slate-200 hover:bg-violet-400/10 hover:text-violet-200'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-700',
    )

  const roleLinks = []
  if (isAuthenticated && user?.role === 'vendor') {
    roleLinks.push({ path: '/vendor-admin', label: 'Vendor Studio' })
  }
  if (isAuthenticated && user?.role === 'admin') {
    roleLinks.push({ path: '/super-admin', label: 'Admin Dashboard' })
  }

  const allLinks = [...links, ...roleLinks]

  return (
    <header className={cx('sticky top-0 z-50 border-b backdrop-blur-xl', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-black uppercase tracking-normal text-violet-700" onClick={closeMenu}>
          Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {allLinks.map((link) => (
            <Link key={link.path} to={link.path} className={linkClass(link.path)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg transition', isDark ? 'bg-slate-800 text-amber-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-violet-100')}
            onClick={toggleTheme}
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg transition', isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-violet-100')}
                onClick={() => navigate('/profile')}
                title="Profile"
                aria-label="Profile"
              >
                <UserCircle size={18} />
              </button>
              <button
                type="button"
                className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg transition', isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-violet-100')}
                onClick={async () => {
                  await logout()
                  navigate('/auth')
                }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          )}

          <button
            type="button"
            className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden', isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900')}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={cx('border-t px-4 py-3 md:hidden', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white')}>
          <div className="mx-auto grid max-w-7xl gap-1">
            {allLinks.map((link) => (
              <Link key={link.path} to={link.path} className={cx(linkClass(link.path), 'block px-4 py-3 text-base')} onClick={closeMenu}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
