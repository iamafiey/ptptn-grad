import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { LevelBar } from '@/components/ui/LevelBar'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import type { SkillLevel } from '@/types/domain'

/**
 * Compact skill row for long lists: category illustration, name, one-line reason,
 * level bar and evidence count. Tap opens the skill sheet (where it is edited).
 */
export function SkillRow({
  name,
  level,
  evidenceCount,
  rationale,
  thumb,
  onOpen,
  badge,
  muted,
}: {
  name: string
  level: SkillLevel
  evidenceCount: number
  rationale: string
  thumb: string
  onOpen: () => void
  badge?: ReactNode
  muted?: boolean
}) {
  const { t } = useT()
  const levelLabel = t(`skill.level.${level}`)
  return (
    <article className={cn('transition-opacity', muted && 'opacity-60')}>
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted">
        <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-control" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate t-body-strong text-ink">{name}</span>
            {badge}
          </span>
          <span className="block truncate t-caption font-normal text-ink-2">{rationale}</span>
          <span className="mt-1.5 flex items-center gap-2">
            <LevelBar level={level} label={levelLabel} className="w-16" />
            <span className="t-caption text-ink">{levelLabel}</span>
            <span className="t-caption font-normal text-ink-3">· {t('skill.evidence', { count: evidenceCount })}</span>
          </span>
        </span>
        <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-ink-3" aria-hidden />
      </button>
    </article>
  )
}
