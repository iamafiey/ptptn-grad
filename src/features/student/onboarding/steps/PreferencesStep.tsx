import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Field, Toggle } from '@/components/ui/Field'
import { useT } from '@/i18n'
import { listRoleInterests, listStates } from '@/services/reference'
import { savePreferences } from '@/services/students'
import type { MalaysianState } from '@/types/domain'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

/** Step 6: role interests, preferred states, relocation, salary floor, earliest start. */
export function PreferencesStep({ state, next }: StepProps) {
  const { t, lt } = useT()
  const p = state.student.preferences
  const [roles, setRoles] = useState<string[]>(p.roleInterests)
  const [states, setStates] = useState<MalaysianState[]>(p.states)
  const [relocate, setRelocate] = useState(p.willingToRelocate)
  const [salary, setSalary] = useState(String(p.salaryFloorRM))
  const [start, setStart] = useState(p.earliestStart)
  const [busy, setBusy] = useState(false)

  return (
    <OnboardingLayout
      stepId="preferences"
      title={t('onboarding.preferences.title')}
      lead={t('onb.prefs.lead')}
      footer={
        <Button
          block
          loading={busy}
          disabled={roles.length === 0}
          onClick={async () => {
            setBusy(true)
            await savePreferences(state.student.id, { roleInterests: roles, states, willingToRelocate: relocate, salaryFloorRM: Number(salary) || 0, earliestStart: start })
            next()
          }}
        >
          {t('action.continue')}
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="mb-2 t-body-strong">{t('onb.prefs.roles')}</p>
          <ChipSelect multiple label={t('onb.prefs.roles')} value={roles} onChange={setRoles} options={listRoleInterests().map((r) => ({ value: r.id, label: lt(r.label) }))} />
        </section>
        <section>
          <p className="mb-2 t-body-strong">{t('onb.prefs.states')}</p>
          <ChipSelect<MalaysianState> multiple label={t('onb.prefs.states')} value={states} onChange={setStates} options={listStates().map((s) => ({ value: s, label: s }))} />
        </section>
        <Card>
          <Toggle checked={relocate} onChange={setRelocate} label={t('onb.prefs.relocate')} description={t('onb.prefs.relocateDesc')} />
        </Card>
        <Field label={t('onb.prefs.salary')} prefix="RM" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value.replace(/\D/g, ''))} />
        <Field label={t('onb.prefs.start')} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
    </OnboardingLayout>
  )
}
