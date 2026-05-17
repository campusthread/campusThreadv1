import { useState, useCallback } from 'react'

export function useNotification() {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'success', actionText = null, actionLink = null) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type, actionText, actionLink }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3500)
  }, [])

  return { notifications, showNotification }
}
