import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, UserCircle, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Navbar({ links = [], cta }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const closeMenu = () => setMenuOpen(false)

  const linkClass = (link) => {
    const path = link.path || link.to
    const isActive = path && location.pathname === path
    return cx(
      'rounded-md px-3 py-2 text-sm font-semibold transition',
      isActive
        ? 'bg-violet-700 text-white'
        : isDark
          ? 'text-slate-200 hover:bg-violet-400/10 hover:text-violet-200'
          : 'text-slate-700 hover:bg-slate-100 hover:text-violet-700',
    )
  }

  const renderLink = (link, mobile = false) => {
    const className = cx(linkClass(link), mobile && 'block px-4 py-3 text-base')
    if (link.href) {
      const isExternal = link.href.startsWith('http')
      return (
        <a
          key={link.label}
          href={link.href}
          className={className}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          onClick={closeMenu}
        >
          {link.label}
        </a>
      )
    }

    const to = link.to || link.path || '/'
    return (
      <Link key={link.label} to={to} className={className} onClick={closeMenu}>
        {link.label}
      </Link>
    )
  }

  const renderCta = (mobile = false) => {
    if (!cta) return null
    const className = cx(
      cta.className || 'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-bold transition',
      isDark ? 'border-white/10 bg-slate-900 text-slate-100 hover:bg-white/5' : 'border-slate-200 bg-white text-slate-950 hover:bg-violet-100',
      mobile && 'w-full',
    )

    if (cta.href) {
      const isExternal = cta.href.startsWith('http')
      return (
        <a
          key={cta.label}
          href={cta.href}
          className={className}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          onClick={closeMenu}
        >
          {cta.label}
        </a>
      )
    }

    const path = cta.to || cta.path || '/'
    return (
      <Link key={cta.label} to={path} className={className} onClick={closeMenu}>
        {cta.label}
      </Link>
    )
  }

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
          {allLinks.map((link) => renderLink(link))}
          {renderCta()}
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
            {allLinks.map((link) => renderLink(link, true))}
            {renderCta(true)}
          </div>
        </div>
      )}
    </header>
  )
}
