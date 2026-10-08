import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { MatchRing } from '@/components/ui/Rings'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import type { RoleAccess } from '@/types/domain'

export interface OpportunityProps {
  title: string
  org: string
  /** Salary or location, already formatted. */
  meta: string
  matchPct: number
  /** Job-family illustration. */
  thumb: string
  /** Employer or portal monogram, pinned to the illustration. */
  monogram: string
  badge?: ReactNode
  /** Partner roles only; open jobs are always full. Repayment details are never passed in. */
  access?: RoleAccess
  onOpen: () => void
  onUnlock?: () => void
}

function Thumb({ thumb, monogram, size }: { thumb: string; monogram: string; size: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <img src={thumb} alt="" className="h-full w-full rounded-control object-cover" />
      <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-chip border border-hairline bg-surface px-0.5 t-micro font-semibold text-ink" aria-hidden>
        {monogram}
      </span>
    </span>
  )
}

function LockOverlay({ onUnlock }: { onUnlock?: () => void }) {
  const { t } = useT()
  return (
    <div className="frost-lock absolute inset-0 grid place-items-center">
      <button onClick={onUnlock} className="inline-flex h-9 items-center gap-2 rounded-control bg-ink px-3 t-caption text-on-ink shadow-2">
        <Lock size={14} strokeWidth={1.5} aria-hidden />
        {t('role.unlockWithGoodStanding')}
      </button>
    </div>
  )
}

/** Compact list row: picture, title, one line of context, match ring. One tap opens the detail sheet. */
export function OpportunityRow({ title, org, meta, matchPct, thumb, monogram, badge, access = 'full', onOpen, onUnlock }: OpportunityProps) {
  const { t } = useT()
  if (access === 'hidden') return null
  const locked = access === 'locked'
  return (
    <div className="relative">
      <button onClick={locked ? undefined : onOpen} disabled={locked} tabIndex={locked ? -1 : 0} aria-hidden={locked || undefined} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted">
        <Thumb thumb={thumb} monogram={monogram} size={48} />
        <span className="min-w-0 flex-1">
          <span className="block truncate t-body-strong">{title}</span>
          <span className="block truncate t-caption font-normal text-ink-2">{org}</span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="truncate t-caption text-ink tabular">{meta}</span>
            {badge}
          </span>
        </span>
        <MatchRing pct={matchPct} label={t('role.match', { pct: matchPct })} />
      </button>
      {locked && <LockOverlay onUnlock={onUnlock} />}
    </div>
  )
}

/** Card for horizontal rails (Home): the same facts, stacked. */
export function OpportunityTile({ title, org, meta, matchPct, thumb, monogram, badge, access = 'full', onOpen, onUnlock }: OpportunityProps) {
  const { t } = useT()
  if (access === 'hidden') return null
  const locked = access === 'locked'
  return (
    <article className="relative h-full overflow-hidden rounded-card border border-hairline bg-surface shadow-1">
      <button onClick={locked ? undefined : onOpen} disabled={locked} tabIndex={locked ? -1 : 0} aria-hidden={locked || undefined} className={cn('flex h-full w-full flex-col p-4 text-left')}>
        <span className="flex items-start justify-between gap-2">
          <Thumb thumb={thumb} monogram={monogram} size={56} />
          <MatchRing pct={matchPct} label={t('role.match', { pct: matchPct })} />
        </span>
        <span className="mt-3 line-clamp-2 t-body-strong">{title}</span>
        <span className="block truncate t-caption font-normal text-ink-2">{org}</span>
        <span className="mt-auto flex items-center gap-2 pt-2">
          <span className="truncate t-caption text-ink tabular">{meta}</span>
        </span>
        {badge && <span className="mt-2">{badge}</span>}
      </button>
      {locked && <LockOverlay onUnlock={onUnlock} />}
    </article>
  )
}
