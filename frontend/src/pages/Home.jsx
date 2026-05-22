import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CreditCard,
  Heart,
  Menu,
  Moon,
  Package,
  ShoppingBag,
  Store,
  Sun,
  Truck,
  UserCheck,
  X,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { usePolicyModal } from '../context/PolicyContext'
import { useGetAdsQuery } from '../redux/slices/adApiSlice'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#stats', label: 'About' },
  { to: '/shop', label: 'Shop' },
  { href: '#contact', label: 'Contact' },
]

const features = [
  {
    icon: ShoppingBag,
    title: 'Curated Selection',
    desc: 'Browse exclusive university apparel and accessories from trusted vendors across the country.',
  },
  {
    icon: UserCheck,
    title: 'Verified Vendors',
    desc: 'Shop from verified campus community members. Every vendor is authenticated and reviewed.',
  },
  {
    icon: Truck,
    title: 'Quick Delivery',
    desc: 'Fast campus delivery options available. Most orders delivered within 24-48 hours on campus.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    desc: 'Multiple payment methods available. Your transactions are secure and protected.',
  },
  {
    icon: Heart,
    title: 'Wishlist & Favorites',
    desc: "Save your favorite items and get notified when they're back in stock.",
  },
  {
    icon: BarChart3,
    title: 'Track Everything',
    desc: 'Monitor your orders, sales, and manage your store all in one place.',
  },
]

const stats = [
  { num: '50+', label: 'Universities' },
  { num: '20+', label: 'Active Vendors' },
  { num: '10K+', label: 'Happy Customers' },
  { num: '5K+', label: 'Products' },
]

const socialLinks = {
  Instagram: 'https://www.instagram.com/campusthread.shop?igsh=aHRlZnV1MHV1eGM5&utm_source=qr',
  TikTok: 'https://www.tiktok.com/@campusthread_?_r=1&_t=ZS-96PnheM766J',
  Email: 'mailto:campusthread7@gmail.com',
}

const footerGroups = [
  {
    title: 'Quick Links',
    links: ['Shop', 'Sell with Us', 'About Us', 'Contact'],
  },
  {
    title: 'Policies',
    links: ['Privacy Policy', 'Terms of Service', 'Return Policy', 'Shipping Info'],
  },
  {
    title: 'Connect',
    links: ['Instagram', 'TikTok', 'Email'],
  },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const { openPolicy } = usePolicyModal()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDark = theme === 'dark'

  // Fetch ads from API instead of localStorage
  const { data: adsData = [] } = useGetAdsQuery()
  const ads = Array.isArray(adsData) ? adsData : []

  // Carousel state for hero ads
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const touchStartXRef = useRef(null)
  const touchCurrentXRef = useRef(null)

  useEffect(() => {
    if (!ads.length) return
    if (isHovered || isInteracting) return
    const id = setInterval(() => {
      setCurrentAdIndex((i) => (i + 1) % ads.length)
    }, 3000)
    return () => clearInterval(id)
  }, [ads.length, isHovered, isInteracting])

  const currentAd = ads.length ? ads[currentAdIndex % ads.length] : null

  const pageClass = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const featuredAd = ads.find((ad) => ad?.imageUrl) || null
  const linkClass = cx(
    'rounded-md px-3 py-2 text-sm font-semibold transition',
    isDark
      ? 'text-slate-200 hover:bg-violet-400/10 hover:text-violet-200'
      : 'text-slate-700 hover:bg-violet-100 hover:text-violet-700',
  )
  const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2'
  const secondaryButton = cx(
    'inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2',
    isDark
      ? 'border-violet-300/40 text-violet-100 hover:bg-violet-300/10'
      : 'border-violet-700 text-violet-700 hover:bg-violet-50',
  )

  const renderNavItem = (item, mobile = false) => {
    const className = mobile
      ? cx(linkClass, 'block w-full px-4 py-3 text-base')
      : linkClass

    return item.to ? (
      <Link key={item.label} to={item.to} className={className} onClick={() => setMenuOpen(false)}>
        {item.label}
      </Link>
    ) : (
      <a key={item.label} href={item.href} className={className} onClick={() => setMenuOpen(false)}>
        {item.label}
      </a>
    )
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <header className={cx('sticky top-0 z-50 border-b backdrop-blur-xl', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-black uppercase tracking-normal text-violet-700">
            Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => renderNavItem(item))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg transition', isDark ? 'bg-slate-800 text-amber-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-violet-100')}
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link to="/auth" className="hidden rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-800 sm:inline-flex">
              Sign In
            </Link>

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
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navLinks.map((item) => renderNavItem(item, true))}
              <Link to="/auth" className={cx(primaryButton, 'mt-2 w-full')} onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className={cx('mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
              Campus apparel marketplace
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Welcome to <span className="text-violet-700">CampusThread</span>
            </h1>
            <p className={cx('mt-6 max-w-2xl text-base leading-8 sm:text-lg', mutedText)}>
              The ultimate marketplace for campus apparel. Find unique, university-themed clothing and accessories from talented vendors, or sell your own creations to the campus community.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/auth" className={primaryButton}>
                <ShoppingBag size={18} />
                Start Shopping
              </Link>
              <Link to="/auth" className={secondaryButton}>
                <Store size={18} />
                Become a Vendor
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={(e) => {
                setIsInteracting(true)
                touchStartXRef.current = e.touches?.[0]?.clientX ?? null
              }}
              onTouchMove={(e) => {
                touchCurrentXRef.current = e.touches?.[0]?.clientX ?? null
              }}
              onTouchEnd={() => {
                const start = touchStartXRef.current ?? 0
                const end = touchCurrentXRef.current ?? start
                const diff = start - end
                const threshold = 50
                if (Math.abs(diff) > threshold && ads.length) {
                  if (diff > 0) {
                    setCurrentAdIndex((i) => (i + 1) % ads.length)
                  } else {
                    setCurrentAdIndex((i) => (i - 1 + ads.length) % ads.length)
                  }
                }
                touchStartXRef.current = null
                touchCurrentXRef.current = null
                setTimeout(() => setIsInteracting(false), 50)
              }}
              className={cx('relative flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border shadow-2xl', isDark ? 'border-violet-300/20 bg-slate-900 shadow-violet-950/30' : 'border-violet-100 bg-white shadow-violet-200/60')}
            >
              {currentAd ? (
                <>
                  <a href={currentAd.link || '/shop'} className="group relative h-full w-full" aria-label={currentAd.title}>
                    <img key={currentAd.id} src={currentAd.imageUrl} alt={currentAd.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
                        Ads
                      </p>
                      <h2 className="text-2xl font-black tracking-normal">{currentAd.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100">{currentAd.description}</p>
                      <span className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-bold text-violet-700 transition group-hover:bg-violet-50">
                        {currentAd.ctaText || 'Learn More'}
                      </span>
                    </div>
                  </a>

                  {/* indicators */}
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {ads.map((a, idx) => (
                      <button
                        key={a.id || idx}
                        onClick={() => setCurrentAdIndex(idx)}
                        aria-label={`Show ad ${idx + 1}`}
                        className={cx(
                          'h-2 w-2 rounded-full transition-opacity',
                          idx === currentAdIndex ? 'bg-white' : 'bg-white/40',
                        )}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={cx('absolute inset-8 rounded-full blur-3xl', isDark ? 'bg-violet-400/20' : 'bg-violet-300/30')} />
                  <Package className="relative h-32 w-32 text-violet-700 opacity-70" strokeWidth={1.5} />
                </>
              )}
            </div>
          </div>
        </section>



        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="features">
          <SectionHeading title="Why Choose" accent="CampusThread?" isDark={isDark} />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title} className={cx('rounded-xl border p-6 text-center shadow-lg transition hover:-translate-y-1 hover:border-violet-500 hover:shadow-violet-900/10', surfaceClass)}>
                <div className={cx('mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl', isDark ? 'bg-violet-300/10 text-violet-200' : 'bg-violet-50 text-violet-700')}>
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className={cx('mt-3 text-sm leading-6', mutedText)}>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-violet-700 px-6 py-12 text-center text-white shadow-xl shadow-violet-950/20 sm:px-10">
            <h2 className="text-3xl font-black tracking-normal">Ready to Join Our Community?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-violet-50">
              Whether you're looking to shop or sell, CampusThread is the perfect platform for campus apparel.
            </p>
            <Link to="/auth" className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50">
              Get Started Now
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="stats">
          <SectionHeading title="By The" accent="Numbers" isDark={isDark} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-violet-700">{stat.num}</div>
                <div className={cx('mt-2 font-semibold', mutedText)}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={cx('mt-12 border-t px-4 py-12 sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')} id="contact">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold">About CampusThread</h3>
            <p className={cx('mt-3 text-sm leading-6', mutedText)}>
              Connecting campus communities through unique apparel and authentic products.
            </p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-bold">{group.title}</h3>
              <div className="mt-3 grid gap-2">
                {group.links.map((link) => {
                  const policyType = link === 'Privacy Policy' ? 'privacy' : link === 'Terms of Service' ? 'terms' : null
                  const socialUrl = socialLinks[link]

                  if (policyType) {
                    return (
                      <button key={link} type="button" onClick={() => openPolicy(policyType)} className={cx('text-sm transition hover:text-violet-600', mutedText)}>
                        {link}
                      </button>
                    )
                  } else if (socialUrl) {
                    const isEmail = link === 'Email'
                    return (
                      <a key={link} href={socialUrl} target={isEmail ? undefined : '_blank'} rel={isEmail ? undefined : 'noopener noreferrer'} className={cx('text-sm transition hover:text-violet-600', mutedText)}>
                        {link}
                      </a>
                    )
                  } else {
                    return (
                      <a key={link} href="#" className={cx('text-sm transition hover:text-violet-600', mutedText)}>
                        {link}
                      </a>
                    )
                  }
                })}
              </div>
            </div>
          ))}
        </div>
        <div className={cx('mx-auto mt-10 max-w-7xl border-t pt-8 text-center text-sm', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
          &copy; 2024 CampusThread. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function SectionHeading({ title, accent, isDark }) {
  return (
    <h2 className={cx('text-center text-3xl font-black tracking-normal sm:text-4xl', isDark ? 'text-slate-100' : 'text-slate-950')}>
      {title} <span className="text-violet-700">{accent}</span>
    </h2>
  )
}
