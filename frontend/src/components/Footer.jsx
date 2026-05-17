import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { usePolicyModal } from '../context/PolicyContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Footer() {
  const { theme } = useTheme()
  const { openPolicy } = usePolicyModal()
  const isDark = theme === 'dark'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const link = cx('text-sm transition hover:text-violet-600', muted)

  return (
    <footer className={cx('mt-12 border-t px-4 py-12 sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="text-lg font-black">CampusThread</h4>
          <p className={cx('mt-3 text-sm leading-6', muted)}>Campus apparel, vendor stores, and student-made products in one marketplace.</p>
        </div>
        <FooterGroup title="Shop">
          <Link to="/shop" className={link}>All Products</Link>
          <Link to="/shop" className={link}>By University</Link>
          <Link to="/explore" className={link}>By Brand</Link>
        </FooterGroup>
        <FooterGroup title="Legal">
          <button type="button" onClick={() => openPolicy('terms')} className={link}>Terms of Service</button>
          <button type="button" onClick={() => openPolicy('privacy')} className={link}>Privacy Policy</button>
        </FooterGroup>
        <FooterGroup title="Follow Us">
          <a href="https://www.instagram.com/campusthread.shop?igsh=aHRlZnV1MHV1eGM5&utm_source=qr" target="_blank" rel="noopener noreferrer" className={link}>Instagram</a>
          <a href="https://www.tiktok.com/@campusthread_?_r=1&_t=ZS-96PnheM766J" target="_blank" rel="noopener noreferrer" className={link}>TikTok</a>
          <a href="mailto:campusthread7@gmail.com" className={link}>Email</a>
        </FooterGroup>
      </div>
      <div className={cx('mx-auto mt-10 max-w-7xl border-t pt-8 text-center text-sm', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
        &copy; 2024 CampusThread. All rights reserved.
      </div>
    </footer>
  )
}

function FooterGroup({ title, children }) {
  return (
    <div>
      <h4 className="text-lg font-black">{title}</h4>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  )
}
