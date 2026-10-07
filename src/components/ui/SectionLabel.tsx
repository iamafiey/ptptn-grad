import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Micro uppercase section label (the only place uppercase is allowed). */
export function SectionLabel({ children, className, action }: { children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className="t-label text-ink-2">{children}</span>
      {action}
    </div>
  )
}
