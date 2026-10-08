import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { ChipTone } from './Chip'

const tones: Partial<Record<ChipTone, string>> = {
  info: 'bg-info text-info-ink',
  done: 'bg-done text-done-ink',
  pending: 'bg-pending text-pending-ink',
  attention: 'bg-attention text-attention-ink',
  muted: 'bg-surface-muted text-ink-2',
}

/** A wrapping signal-coloured note (chips never wrap; use this for sentences). */
export function Note({ tone = 'info', icon, children, className }: { tone?: ChipTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-control px-3 py-2 t-caption', tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}
