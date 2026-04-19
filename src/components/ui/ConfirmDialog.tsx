import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

const variantStyles = {
  danger: { btn: 'bg-red-600 hover:bg-red-500', icon: '!', iconBg: 'bg-red-500/15 text-red-400' },
  warning: { btn: 'bg-amber-500 hover:bg-amber-400', icon: '!', iconBg: 'bg-amber-500/15 text-amber-400' },
  default: { btn: 'bg-violet-600 hover:bg-violet-500', icon: '?', iconBg: 'bg-violet-500/15 text-violet-400' },
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const variantStyle = variantStyles[variant]

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9900] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm mx-4 animate-scale-in"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: '28px 24px',
        }}
      >
        <div className={`w-12 h-12 rounded-2xl ${variantStyle.iconBg} flex items-center justify-center text-xl mx-auto mb-4`}>
          {variantStyle.icon}
        </div>

        <h2 className="text-center text-[17px] font-bold mb-2" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <p className="text-center text-[13px] leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>

        <div className="flex gap-2.5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all ${variantStyle.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
