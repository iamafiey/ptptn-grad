import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Note } from '@/components/ui/Note'
import { Toggle } from '@/components/ui/Field'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useT } from '@/i18n'
import { toEmployerView } from '@/services/profile'
import { setVisibility } from '@/services/students'
import { EmployerPreview } from '../../skills/EmployerPreview'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

/** Step 10: "Let Talent Partners find me" (default on), with exactly what employers see. */
export function VisibleStep({ state, next }: StepProps) {
  const { t } = useT()
  const [on, setOn] = useState(state.student.visibility.partnersCanFind)
  const [busy, setBusy] = useState(false)
  const preview = toEmployerView(state.student, state.skills ?? [])

  return (
    <OnboardingLayout
      stepId="visible"
      title={t('onboarding.visible.title')}
      lead={t('onb.visible.lead')}
      footer={
        <Button
          block
          loading={busy}
          onClick={async () => {
            setBusy(true)
            await setVisibility(state.student.id, on)
            next()
          }}
        >
          {t('onb.visible.finish')}
        </Button>
      }
    >
      <Card>
        <Toggle checked={on} onChange={setOn} label={t('onb.visible.toggle')} description={t('onb.visible.toggleDesc')} />
      </Card>
      {state.student.isFinalYear && (
        <Note className="mt-3">{t('onb.visible.finalYear')}</Note>
      )}
      <SectionLabel className="mb-3 mt-6">{t('onb.visible.preview')}</SectionLabel>
      <EmployerPreview profile={preview} limit={6} />
    </OnboardingLayout>
  )
}
