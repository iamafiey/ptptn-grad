import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Horizontal, snap-scrolling row of cards. Bleeds to the screen edge so the next card peeks in. */
export function Rail({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div role="list" aria-label={label} className={cn('-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {children}
    </div>
  )
}

export function RailItem({ children, width = 248 }: { children: ReactNode; width?: number }) {
  return (
    <div role="listitem" className="shrink-0 snap-start" style={{ width }}>
      {children}
    </div>
  )
}
