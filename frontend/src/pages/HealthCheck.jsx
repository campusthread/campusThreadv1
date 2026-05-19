import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'
import { healthAPI } from '../utils/api'

const authLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/explore', label: 'Explore' },
    { path: '/auth', label: 'Sign In / Sign Up' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function HealthCheck() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [status, setStatus] = useState('Checking connection...')
    const [details, setDetails] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await healthAPI.check()
                setDetails(response.data)
                setStatus('Connected to backend successfully')
                setError(null)
            } catch (err) {
                setStatus('Unable to reach backend')
                setError(err.message || 'Connection failed')
                setDetails(null)
            }
        }

        fetchHealth()
    }, [])

    const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
    const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
    const mutedText = isDark ? 'text-slate-400' : 'text-slate-600'

    return (
        <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
            <Navbar links={authLinks} />
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <section className={cx('rounded-3xl border p-8', surfaceClass)}>
                    <h1 className="text-3xl font-black tracking-normal">Render Deployment Connectivity</h1>
                    <p className={cx('mt-3 text-sm', mutedText)}>
                        This page tests whether the frontend can connect to the deployed backend on Render.
                    </p>
                    <div className="mt-8 space-y-4">
                        <div className={cx('rounded-3xl border p-6', isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                            <p className="text-sm font-semibold">Connection status</p>
                            <p className={cx('mt-2 text-lg font-bold', error ? 'text-rose-400' : 'text-emerald-500')}>{status}</p>
                            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
                        </div>
                        {details && (
                            <div className={cx('rounded-3xl border p-6', isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                                <p className="text-sm font-semibold">Backend details</p>
                                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Environment</dt>
                                        <dd className="mt-1 font-semibold">{details.env}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Client URL</dt>
                                        <dd className="mt-1 font-semibold break-all">{details.clientUrl}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Timestamp</dt>
                                        <dd className="mt-1 font-semibold">{details.timestamp}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                        <div className={cx('rounded-3xl border p-6 text-sm', isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                            <p className="font-semibold">What this checks</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-500 dark:text-slate-300">
                                <li>Frontend is using the deployed backend API URL from Vercel env.</li>
                                <li>Backend responds successfully on `/api/health`.</li>
                                <li>If this fails, the deployed frontend cannot reach the Render backend.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
