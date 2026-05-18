import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function ResetSuccess() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
    const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'

    return (
        <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
            <Navbar links={[{ path: '/', label: 'Home' }, { path: '/shop', label: 'Shop' }, { path: '/explore', label: 'Explore' }, { path: '/auth', label: 'Sign In / Sign Up' }]} />
            <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
                <section className={cx('rounded-2xl border p-6 shadow-lg sm:p-8 text-center', surfaceClass)}>
                    <h1 className="text-3xl font-black tracking-tight text-violet-700">Password reset complete</h1>
                    <p className="mt-4 text-sm text-slate-500">Your CampusThread password has been updated successfully. You can now sign in with your new password.</p>
                    <Link
                        to="/auth"
                        className="mt-8 inline-flex rounded-lg bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-800"
                    >
                        Go to sign in
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    )
}
