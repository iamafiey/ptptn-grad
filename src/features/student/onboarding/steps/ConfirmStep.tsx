import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { useT } from '@/i18n'
import { listCgpaBands } from '@/services/reference'
import { updateStudent } from '@/services/students'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

/** Step 3: auto-filled from the PTPTN loan record. "Looks right" or edit. */
export function ConfirmStep({ state, next }: StepProps) {
  const { t } = useT()
  const s = state.student
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ institution: s.institution, programme: s.programme, graduationYear: String(s.graduationYear), cgpaBand: s.cgpaBand })

  const rows: [string, string][] = [
    [t('field.institution'), s.institution],
    [t('field.programme'), s.programme],
    [t('field.gradYear'), String(s.graduationYear)],
    [t('field.cgpa'), s.cgpaBand],
  ]

  return (
    <OnboardingLayout
      stepId="confirm"
      title={t('onboarding.confirm.title')}
      lead={t('onb.confirm.lead')}
      footer={
        <div className="space-y-2">
          <Button block onClick={next}>
            {t('onb.confirm.ok')}
          </Button>
          <Button block variant="secondary" onClick={() => setEditing(true)}>
            {t('action.edit')}
          </Button>
        </div>
      }
    >
      <Card padded={false} className="divide-y divide-hairline">
        {rows.map(([k, v]) => (
          <div key={k} className="px-4 py-3">
            <p className="t-caption text-ink-2">{k}</p>
            <p className="t-body-strong tabular">{v}</p>
          </div>
        ))}
      </Card>
      <p className="mt-3 t-caption font-normal text-ink-3">{t('onb.confirm.source')}</p>

      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title={t('onb.confirm.editTitle')}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            onClick={async () => {
              await updateStudent(s.id, { institution: form.institution, programme: form.programme, graduationYear: Number(form.graduationYear) || s.graduationYear, cgpaBand: form.cgpaBand })
              setEditing(false)
            }}
          >
            {t('action.save')}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label={t('field.institution')} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          <Field label={t('field.programme')} value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })} />
          <Field label={t('field.gradYear')} inputMode="numeric" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
          <Select label={t('field.cgpa')} value={form.cgpaBand} onChange={(e) => setForm({ ...form, cgpaBand: e.target.value })} options={listCgpaBands().map((b) => ({ value: b, label: b }))} />
        </div>
      </Sheet>
    </OnboardingLayout>
  )
}
