interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export function Skeleton({ className = '', width, height, rounded }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ width, height: height ?? 16 }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton width={36} height={36} className="rounded-xl" />
        <Skeleton width={60} height={18} />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton width="60%" height={28} />
        <Skeleton width="45%" height={14} />
      </div>
    </div>
  )
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-5 py-3.5">
          <Skeleton width={j === 0 ? 140 : 80} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}
