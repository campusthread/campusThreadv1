import { Loader2 } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function SectionLoader({ message = 'Loading…', isDark = false }) {
    return (
        <div className={cx('flex flex-col items-center justify-center rounded-2xl border p-10 text-center', isDark ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
            <Loader2 className="mb-4 animate-spin" size={32} />
            <p className={cx('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>{message}</p>
        </div>
    )
}
