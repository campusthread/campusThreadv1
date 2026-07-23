import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Heart, Home, LayoutGrid, LogOut, Moon, ShoppingBag, ShoppingCart, Store, Sun, UserCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGetCartQuery, useGetFavoritesQuery } from '../redux/slices/cartFavoritesApiSlice'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Navbar({ links = [], cta }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const { data: cartData = [] } = useGetCartQuery(undefined, { skip: !isAuthenticated })
  const { data: favoritesData = [] } = useGetFavoritesQuery(undefined, { skip: !isAuthenticated })
  const cartCount = Array.isArray(cartData) ? cartData.length : 0
  const favoriteCount = Array.isArray(favoritesData) ? favoritesData.length : 0

  const closeMenu = () => setMenuOpen(false)

  const isActivePath = (path) => {
    if (!path || path === '/') return location.pathname === '/'
    if (location.pathname === path) return true
    return location.pathname.startsWith(`${path}/`)
  }

  const primaryTabMap = {
    '/': { label: 'Home', icon: Home },
    '/shop': { label: 'Shop', icon: ShoppingBag },
    '/explore': { label: 'Explore', icon: Compass },
    '/vendors': { label: 'Vendors', icon: Store },
    '/cart': { label: 'Cart', icon: ShoppingCart },
    '/favorites': { label: 'Favorites', icon: Heart },
  }

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

  const renderBadge = (count) => count > 0 ? (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
      {count > 9 ? '9+' : count}
    </span>
  ) : null

  const renderLink = (link, mobile = false) => {
    const className = cx(linkClass(link), mobile && 'block px-4 py-3 text-base')
    const to = link.to || link.path || '/'
    const badgeCount = to === '/cart' ? cartCount : to === '/favorites' ? favoriteCount : 0

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
          <span className="inline-flex items-center">
            {link.label}
            {renderBadge(badgeCount)}
          </span>
        </a>
      )
    }

    return (
      <Link key={link.label} to={to} className={className} onClick={closeMenu}>
        <span className="inline-flex items-center">
          {link.label}
          {renderBadge(badgeCount)}
        </span>
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
    roleLinks.push({ path: '/vendor-admin', label: 'Vendor Dashboard' })
  }
  if (isAuthenticated && user?.role === 'admin') {
    roleLinks.push({ path: '/super-admin', label: 'Admin Dashboard' })
  }

  const standardDesktopLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/explore', label: 'Explore' },
    { path: '/cart', label: 'Cart' },
    { path: '/favorites', label: 'Favorites' },
  ]

  const desktopNavLinks = [
    ...standardDesktopLinks,
    ...(isAuthenticated && user?.role === 'vendor' ? [{ path: '/vendor-admin', label: 'Dashboard' }] : []),
    ...(isAuthenticated && user?.role === 'admin' ? [{ path: '/super-admin', label: 'Admin' }] : []),
  ]

  const allLinks = [...links, ...roleLinks]
  const primaryNavLinks = allLinks.filter((link) => {
    const path = link.path || link.to || link.href || ''
    const label = (link.label || '').toLowerCase()
    return ['/', '/shop', '/explore', '/vendors', '/cart', '/favorites'].includes(path) || ['home', 'shop', 'explore', 'vendors', 'cart', 'favorites'].includes(label)
  })
  const secondaryNavLinks = allLinks.filter((link) => {
    const path = link.path || link.to || link.href || ''
    return !primaryNavLinks.includes(link) && !desktopNavLinks.some((desktopLink) => desktopLink.path === path)
  })

  const baseBottomNavLinks = primaryNavLinks.length > 0
    ? primaryNavLinks.map((link) => {
      const path = link.path || link.to || link.href || '/'
      const preset = primaryTabMap[path] || primaryTabMap[path.toLowerCase()]
      return {
        ...link,
        path,
        label: preset?.label || link.label || 'Home',
        icon: preset?.icon || Home,
      }
    })
    : Object.entries(primaryTabMap).map(([path, config]) => ({ path, label: config.label, icon: config.icon }))

  const bottomNavLinks = [
    ...baseBottomNavLinks,
    ...(isAuthenticated && user?.role === 'admin'
      ? [{ path: '/super-admin', label: 'Admin', icon: LayoutGrid }]
      : []),
    ...(isAuthenticated && user?.role === 'vendor'
      ? [{ path: '/vendor-admin', label: 'Dashboard', icon: Store }]
      : []),
  ]

  return (
    <>
      <header className={cx('sticky top-0 z-50 border-b backdrop-blur-xl', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0 whitespace-nowrap text-sm font-black uppercase tracking-normal text-violet-700 sm:text-xl" onClick={closeMenu}>
            Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {desktopNavLinks.map((link) => renderLink(link))}
            {secondaryNavLinks.map((link) => renderLink(link))}
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

          </div>
        </nav>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t px-1.5 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:hidden" style={{ backgroundColor: isDark ? 'rgba(2, 6, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-around gap-1.5">
          {bottomNavLinks.map(({ path, label, icon: Icon }) => {
            const active = isActivePath(path)
            const badgeCount = path === '/cart' ? cartCount : path === '/favorites' ? favoriteCount : 0
            return (
              <Link
                key={path}
                to={path}
                className={cx(
                  'relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1.5 py-3 text-[10px] font-semibold transition min-h-[56px]',
                  active
                    ? 'bg-violet-600/10 text-violet-600'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-violet-700',
                )}
                onClick={closeMenu}
              >
                <div className="relative">
                  <Icon size={18} />
                  {badgeCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className="mt-1 leading-none">{label}</span>
              </Link>
            )
          })}

        </div>
      </div>

      <div className="h-20 md:hidden" />

      {menuOpen && (
        <div className={cx('border-t px-4 py-3 md:hidden', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white')}>
          <div className="mx-auto grid max-w-7xl gap-1">
            {allLinks.map((link) => renderLink(link, true))}
            {renderCta(true)}
          </div>
        </div>
      )}
    </>
  )
}
