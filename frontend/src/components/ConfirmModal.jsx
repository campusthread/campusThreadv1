import { X } from 'lucide-react'

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-800">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
