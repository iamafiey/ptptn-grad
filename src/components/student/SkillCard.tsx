import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LevelBar } from '@/components/ui/LevelBar'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import type { SkillLevel } from '@/types/domain'

/**
 * Name, 3-segment level bar, evidence count chip, rationale in ink-2. Tap opens the skill sheet.
 * `badge` shows status (hidden, under review…); `actions` render below, outside the tap target.
 */
export function SkillCard({
  name,
  level,
  evidenceCount,
  rationale,
  onOpen,
  badge,
  actions,
  muted,
}: {
  name: string
  level: SkillLevel
  evidenceCount: number
  rationale: string
  onOpen?: () => void
  badge?: ReactNode
  actions?: ReactNode
  muted?: boolean
}) {
  const { t } = useT()
  const levelLabel = t(`skill.level.${level}`)
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="t-body-strong text-ink">{name}</h3>
        <Chip tone="muted" size="sm">
          {t('skill.evidence', { count: evidenceCount })}
        </Chip>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <LevelBar level={level} label={levelLabel} className="flex-1" />
        <span className="t-caption text-ink">{levelLabel}</span>
      </div>
      <p className="mt-2 t-caption font-normal text-ink-2">{rationale}</p>
      {badge && <div className="mt-2">{badge}</div>}
    </>
  )
  return (
    <Card as="article" className={cn('transition-opacity', muted && 'opacity-60')}>
      {onOpen ? (
        <button onClick={onOpen} className="block w-full text-left">
          {body}
        </button>
      ) : (
        body
      )}
      {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">{actions}</div>}
    </Card>
  )
}
