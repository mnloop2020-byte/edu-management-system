import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function notify(nextToasts: Toast[]) {
  toasts = nextToasts
  listeners.forEach(listener => listener([...toasts]))
}

export const toast = {
  success: (message: string, duration = 3500) => addToast(message, 'success', duration),
  error: (message: string, duration = 4500) => addToast(message, 'error', duration),
  info: (message: string, duration = 3500) => addToast(message, 'info', duration),
  warning: (message: string, duration = 4000) => addToast(message, 'warning', duration),
}

function addToast(message: string, type: ToastType, duration: number) {
  const id = Math.random().toString(36).slice(2)
  notify([...toasts, { id, message, type, duration }])

  setTimeout(() => {
    notify(toasts.filter(toastItem => toastItem.id !== id))
  }, duration)
}

const icons: Record<ToastType, string> = {
  success: '+',
  error: 'x',
  info: 'i',
  warning: '!',
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
}

const iconStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  warning: 'bg-amber-500/20 text-amber-400',
}

const textStyles: Record<ToastType, string> = {
  success: 'text-emerald-100',
  error: 'text-red-100',
  info: 'text-blue-100',
  warning: 'text-amber-100',
}

function ToastItem({ toast: toastItem, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false)

  const handleRemove = () => {
    setLeaving(true)
    setTimeout(() => onRemove(toastItem.id), 280)
  }

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), (toastItem.duration ?? 3500) - 320)
    return () => clearTimeout(timer)
  }, [toastItem.duration])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl
        ${styles[toastItem.type]} transition-all duration-300
        ${leaving ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-toast-in'}`}
      style={{ minWidth: 280, maxWidth: 380 }}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${iconStyles[toastItem.type]}`}>
        {icons[toastItem.type]}
      </span>
      <p className={`text-[13px] font-medium flex-1 leading-snug ${textStyles[toastItem.type]}`}>{toastItem.message}</p>
      <button
        onClick={handleRemove}
        className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors shrink-0"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setCurrentToasts)
    return () => {
      listeners = listeners.filter(listener => listener !== setCurrentToasts)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    notify(toasts.filter(toastItem => toastItem.id !== id))
  }, [])

  if (!currentToasts.length) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
      {currentToasts.map(toastItem => (
        <div key={toastItem.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toastItem} onRemove={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  )
}
