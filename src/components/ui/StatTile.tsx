import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Glanceable tile: a visual (icon, ring), one figure and a short label. Tappable when `onClick` is set. */
export function StatTile({ visual, value, label, extra, onClick, className }: { visual: ReactNode; value: ReactNode; label: string; extra?: ReactNode; onClick?: () => void; className?: string }) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        {visual}
        {onClick && <ChevronRight size={16} strokeWidth={1.5} className="text-ink-3" aria-hidden />}
      </span>
      <span className="mt-3 block t-heading leading-none">{value}</span>
      <span className="mt-1 block t-caption font-normal text-ink-2">{label}</span>
      {extra && <span className="mt-2 block">{extra}</span>}
    </>
  )
  const cls = cn('block w-full rounded-card border border-hairline bg-surface p-4 text-left shadow-1', className)
  return onClick ? (
    <button onClick={onClick} className={cn(cls, 'transition-colors hover:bg-surface-muted')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}
