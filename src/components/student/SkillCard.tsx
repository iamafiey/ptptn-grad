import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LevelBar } from '@/components/ui/LevelBar'
import { useT } from '@/i18n'
import type { SkillLevel } from '@/types/domain'

/** Name, 3-segment level bar, evidence count chip, rationale in ink-2. Tap opens the skill sheet. */
export function SkillCard({ name, level, evidenceCount, rationale, onOpen }: { name: string; level: SkillLevel; evidenceCount: number; rationale: string; onOpen?: () => void }) {
  const { t } = useT()
  const levelLabel = t(`skill.level.${level}`)
  return (
    <Card as="article" className="transition-transform active:scale-[0.99]">
      <button onClick={onOpen} className="block w-full text-left">
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
      </button>
    </Card>
  )
}
