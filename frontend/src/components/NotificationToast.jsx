import { Link } from 'react-router-dom'

const tone = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-sky-600',
  warning: 'bg-amber-500 text-slate-950',
}

export default function NotificationToast({ notifications }) {
  return (
    <div className="fixed right-4 top-4 z-[100] grid w-[min(92vw,24rem)] gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${tone[notification.type] || tone.info}`}
        >
          <span>{notification.message}</span>
          {notification.actionText && notification.actionLink && (
            <Link to={notification.actionLink} className="shrink-0 underline">
              {notification.actionText}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
