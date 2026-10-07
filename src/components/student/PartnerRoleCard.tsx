import { Lock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LogoTile } from '@/components/ui/Tiles'
import { MatchRing } from '@/components/ui/Rings'
import { useT } from '@/i18n'
import { formatRMRange } from '@/lib/format'
import type { MoneyRangeRM, RoleAccess } from '@/types/domain'

export interface PartnerRoleCardProps {
  title: string
  partnerName: string
  monogram: string
  location: string
  salary: MoneyRangeRM
  matchPct: number
  skills: string[]
  /** The only tier-derived input a job surface ever receives. */
  access: RoleAccess
  onOpen?: () => void
  onUnlock?: () => void
}

/**
 * Premium partner role. When `access === 'locked'` the same card is frosted over with a
 * centred ink button — the content shape stays visible so the reward feels real.
 * Repayment details are never passed in or shown here.
 */
export function PartnerRoleCard({ title, partnerName, monogram, location, salary, matchPct, skills, access, onOpen, onUnlock }: PartnerRoleCardProps) {
  const { t } = useT()
  if (access === 'hidden') return null
  const locked = access === 'locked'

  return (
    <Card as="article" className="relative overflow-hidden">
      <div aria-hidden={locked || undefined} className={locked ? 'select-none' : undefined}>
        <button onClick={locked ? undefined : onOpen} disabled={locked} tabIndex={locked ? -1 : 0} className="block w-full text-left">
          <div className="flex items-start gap-3">
            <LogoTile monogram={monogram} />
            <div className="min-w-0 flex-1">
              <h3 className="t-subheading text-ink">{title}</h3>
              <p className="t-caption text-ink-2">{partnerName}</p>
            </div>
            <MatchRing pct={matchPct} label={t('role.match', { pct: matchPct })} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 t-caption text-ink-2">
            <span className="t-body-strong text-ink tabular">{formatRMRange(salary)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} strokeWidth={1.5} aria-hidden />
              {location}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone="ink" size="sm">{t('status.talentPartner')}</Chip>
            {skills.slice(0, 3).map((s) => (
              <Chip key={s} tone="muted" size="sm">
                {s}
              </Chip>
            ))}
          </div>
        </button>
      </div>
      {locked && (
        <div className="frost-lock absolute inset-0 grid place-items-center">
          <button onClick={onUnlock} className="inline-flex h-10 items-center gap-2 rounded-control bg-ink px-4 t-caption text-on-ink shadow-2">
            <Lock size={16} strokeWidth={1.5} aria-hidden />
            {t('role.unlockWithGoodStanding')}
          </button>
        </div>
      )}
    </Card>
  )
}
