import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ChipTone = 'done' | 'pending' | 'attention' | 'info' | 'muted' | 'ink' | 'outline'

const tones: Record<ChipTone, string> = {
  done: 'bg-done text-done-ink',
  pending: 'bg-pending text-pending-ink',
  attention: 'bg-attention text-attention-ink',
  info: 'bg-info text-info-ink',
  muted: 'bg-surface-muted text-ink-2',
  ink: 'bg-ink text-on-ink',
  outline: 'border border-hairline text-ink-2',
}

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone
  icon?: ReactNode
  size?: 'md' | 'sm'
}

/** Signal chips always use dark text on a light fill — never large fills. */
export function Chip({ tone = 'muted', icon, size = 'md', className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-chip tabular',
        size === 'md' ? 'h-7 px-2.5 t-caption' : 'h-5 px-1.5 t-micro',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}
