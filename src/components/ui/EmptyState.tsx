interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({
  icon,
  title = 'Nothing here yet',
  message = 'No data to display at the moment.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {icon ? (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}
        >
          {icon}
        </div>
      ) : (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(124,58,237,0.08)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      )}
      <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 btn-primary px-5 py-2 text-[13px]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
