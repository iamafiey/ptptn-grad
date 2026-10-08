import { AlertTriangle, Check, CircleDashed, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Check as CheckState } from '@/types/domain'

const ICON = { pass: Check, warn: AlertTriangle, fail: X, pending: CircleDashed }
const TONE = { pass: 'bg-done text-done-ink', warn: 'bg-pending text-pending-ink', fail: 'bg-attention text-attention-ink', pending: 'bg-surface-muted text-ink-2' }

/** Pass / warn / fail chip with an icon (never colour alone). */
export function CheckBadge({ state, label }: { state: CheckState; label: string }) {
  const I = ICON[state]
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-chip', TONE[state])} aria-hidden>
        <I size={14} strokeWidth={2} />
      </span>
      <span>{label}</span>
      <span className="sr-only">({state})</span>
    </span>
  )
}
