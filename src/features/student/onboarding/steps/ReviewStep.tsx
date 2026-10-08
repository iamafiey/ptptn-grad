import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { SkillCard } from '@/components/student/SkillCard'
import { useT } from '@/i18n'
import { hideSkill, keepSkill, lowerSkill } from '@/services/students'
import { skillById } from '@/services/taxonomy'
import { AddSkillSheet } from '../../skills/AddSkillSheet'
import { DisputeSheet } from '../../skills/DisputeSheet'
import { statusChip } from '../../skills/skillHelpers'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

/** Step 9: per skill — Keep, Edit level down, Hide, or "This isn't right". Add a missing skill at Foundation. */
export function ReviewStep({ state, next }: StepProps) {
  const { t, lt } = useT()
  const id = state.student.id
  const skills = state.skills ?? []
  const [adding, setAdding] = useState(false)
  const [disputing, setDisputing] = useState<string | null>(null)
  const kept = skills.filter((s) => s.status !== 'hidden' && s.status !== 'disputed').length
  const name = (sid: string) => lt(skillById(sid)?.name ?? { en: sid })

  return (
    <OnboardingLayout
      stepId="review"
      title={t('onboarding.review.title')}
      lead={t('onb.review.lead')}
      footer={
        <Button block onClick={next}>
          {t('onb.review.confirm')}
        </Button>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <Chip tone="done">{t('onb.review.kept', { count: kept })}</Chip>
        <Button variant="secondary" size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => setAdding(true)}>
          {t('onb.review.addMissing')}
        </Button>
      </div>
      <ul className="space-y-3">
        {skills.map((s) => {
          const chip = statusChip(s)
          const hidden = s.status === 'hidden'
          const disputed = s.status === 'disputed'
          return (
            <li key={s.skillId}>
              <SkillCard
                name={name(s.skillId)}
                level={s.level}
                evidenceCount={s.evidenceIds.length}
                rationale={lt(s.rationale)}
                muted={hidden || disputed}
                badge={chip && <Chip tone={chip.tone} size="sm">{t(chip.key)}</Chip>}
                actions={
                  <>
                    {hidden ? (
                      <Button variant="secondary" size="sm" onClick={() => keepSkill(id, s.skillId)}>
                        {t('skill.action.keep')}
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled={disputed} onClick={() => hideSkill(id, s.skillId)}>
                        {t('skill.action.hide')}
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" disabled={s.level === 'foundation' || disputed} onClick={() => lowerSkill(id, s.skillId)}>
                      {t('skill.action.lower')}
                    </Button>
                    <Button variant="tertiary" size="sm" disabled={disputed} onClick={() => setDisputing(s.skillId)}>
                      {t('skill.action.dispute')}
                    </Button>
                  </>
                }
              />
            </li>
          )
        })}
      </ul>
      <AddSkillSheet studentId={id} existing={skills.map((s) => s.skillId)} open={adding} onClose={() => setAdding(false)} />
      {disputing && <DisputeSheet studentId={id} skillId={disputing} skillName={name(disputing)} open onClose={() => setDisputing(null)} />}
    </OnboardingLayout>
  )
}
