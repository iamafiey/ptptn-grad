import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Compact bar: avatar left (opens Settings), actions right (bell). Glass fades in as the
 * large title (rendered by <LargeTitle/> in the content) scrolls away.
 */
export function TopAppBar({ title, progress, leading, trailing, className }: { title: string; progress: number; leading: ReactNode; trailing: ReactNode; className?: string }) {
  return (
    <header className={cn('sticky top-0 z-30 pt-[var(--safe-top)]', className)}>
      <div
        className="glass pointer-events-none absolute inset-0 !rounded-none !border-x-0 !border-t-0 transition-opacity duration-200"
        style={{ opacity: progress }}
        aria-hidden
      />
      <div className="relative flex h-14 items-center gap-3 px-5">
        <div className="shrink-0">{leading}</div>
        <p className="min-w-0 flex-1 truncate text-center t-subheading text-ink transition-opacity duration-200" style={{ opacity: progress }} aria-hidden={progress < 0.5}>
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      </div>
    </header>
  )
}

/** Large title that cross-fades into the compact bar. */
export function LargeTitle({ children, progress, eyebrow }: { children: ReactNode; progress: number; eyebrow?: ReactNode }) {
  return (
    <div className="px-5 pb-4 pt-1 transition-opacity duration-200" style={{ opacity: 1 - progress }}>
      {eyebrow && <div className="mb-1 t-caption text-ink-2">{eyebrow}</div>}
      <h1 className="t-title text-ink">{children}</h1>
    </div>
  )
}
