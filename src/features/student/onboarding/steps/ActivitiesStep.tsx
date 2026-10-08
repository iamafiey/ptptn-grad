import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Field } from '@/components/ui/Field'
import { StrengthBar } from '@/components/ui/StrengthBar'
import { Textarea } from '@/components/ui/Textarea'
import { SAMPLE_ACTIVITY } from '@/data/students'
import { useT } from '@/i18n'
import { addActivity, removeActivity, type ActivityInput } from '@/services/students'
import type { ActivityKind } from '@/types/domain'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

const KINDS: ActivityKind[] = ['club', 'partTime', 'internship', 'competition', 'freelance']
type Ev = 'certificate' | 'letter' | 'photo' | 'none'

const EMPTY = { kind: 'club' as ActivityKind, organisation: '', role: '', months: '', description: '', outcome: '', evidence: 'none' as Ev }

function monthsOf(a: { startDate: string; endDate?: string }) {
  const s = new Date(a.startDate)
  const e = new Date(a.endDate ?? '2026-10-07')
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth())
}

/** Step 5: guided cards, one activity at a time, with example prompts and evidence. */
export function ActivitiesStep({ state, next }: StepProps) {
  const { t } = useT()
  const id = state.student.id
  const [composing, setComposing] = useState(state.activities.length === 0)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const activitiesMissing = state.strength.missing.find((m) => m.id === 'activities')
  const valid = form.organisation.trim() && form.role.trim() && form.description.trim().length > 10 && Number(form.months) > 0

  const save = async () => {
    setSaving(true)
    const input: ActivityInput = {
      kind: form.kind,
      organisation: form.organisation,
      role: form.role,
      months: Number(form.months),
      description: form.description,
      outcome: form.outcome,
      evidence: form.evidence === 'none' ? null : form.evidence,
    }
    await addActivity(id, input)
    setSaving(false)
    setForm(EMPTY)
    setComposing(false)
  }

  const fillExample = () =>
    setForm({ ...SAMPLE_ACTIVITY, months: String(SAMPLE_ACTIVITY.months), evidence: 'certificate' })

  return (
    <OnboardingLayout
      stepId="activities"
      title={t('onboarding.activities.title')}
      lead={t('onb.activities.lead')}
      footer={
        composing ? (
          <div className="flex gap-2">
            {state.activities.length > 0 && (
              <Button variant="secondary" onClick={() => setComposing(false)}>
                {t('action.cancel')}
              </Button>
            )}
            <Button block disabled={!valid} loading={saving} onClick={save}>
              {t('onb.activities.save')}
            </Button>
          </div>
        ) : (
          <Button block disabled={state.activities.length === 0} onClick={next}>
            {t('action.continue')}
          </Button>
        )
      }
    >
      <StrengthBar pct={state.strength.pct} label={t('profile.strengthLabel')} />

      {state.activities.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 t-label text-ink-2">{t('onb.activities.added')}</p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {state.activities.map((a) => (
                <motion.li key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="t-body-strong">{a.role}</p>
                      <p className="t-caption font-normal text-ink-2">
                        {a.organisation} · {t('common.months', { count: monthsOf(a) })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip tone="muted" size="sm">
                          {t(`kind.${a.kind}`)}
                        </Chip>
                        {a.evidenceIds.length > 0 && (
                          <Chip tone="done" size="sm" icon={<FileText size={12} strokeWidth={1.5} />}>
                            {t('skill.evidence', { count: a.evidenceIds.length })}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <IconButton label={t('action.remove')} size={36} onClick={() => removeActivity(id, a.id)}>
                      <Trash2 size={16} strokeWidth={1.5} />
                    </IconButton>
                  </Card>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {composing ? (
        <Card className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="t-subheading">{t('onb.activities.composer')}</p>
            <Button variant="tertiary" size="sm" onClick={fillExample}>
              {t('onb.activities.tryExample')}
            </Button>
          </div>
          <div>
            <p className="mb-2 t-caption text-ink-2">{t('onb.activities.type')}</p>
            <ChipSelect<ActivityKind> label={t('onb.activities.type')} value={[form.kind]} onChange={(v) => setForm({ ...form, kind: v[0] })} options={KINDS.map((k) => ({ value: k, label: t(`kind.${k}`) }))} />
          </div>
          <Field label={t('field.organisation')} hint={t('onb.activities.example.organisation')} value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
          <Field label={t('field.role')} hint={t('onb.activities.example.role')} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Field label={t('field.months')} inputMode="numeric" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value.replace(/\D/g, '') })} />
          <Textarea label={t('field.whatYouDid')} hint={t('onb.activities.example.what')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea label={`${t('field.outcome')} · ${t('common.optional')}`} hint={t('onb.activities.example.outcome')} rows={2} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
          <div>
            <p className="mb-1 t-caption text-ink-2">{t('onb.activities.evidence')}</p>
            <p className="mb-2 t-caption font-normal text-ink-3">{t('onb.activities.evidenceHint')}</p>
            <ChipSelect<Ev>
              label={t('onb.activities.evidence')}
              value={[form.evidence]}
              onChange={(v) => setForm({ ...form, evidence: v[0] })}
              options={[
                { value: 'certificate', label: t('evidence.certificate') },
                { value: 'letter', label: t('evidence.letter') },
                { value: 'photo', label: t('evidence.photo') },
                { value: 'none', label: t('evidence.none') },
              ]}
            />
          </div>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          <Button variant="secondary" block icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setComposing(true)}>
            {state.activities.length ? t('onb.activities.addAnother') : t('onb.activities.add')}
          </Button>
          {activitiesMissing && (
            <div className="flex items-start justify-between gap-3 px-1">
              <p className="t-caption font-normal text-ink-2">{t('onb.activities.skipCost', { points: activitiesMissing.points - Math.min(3, state.activities.length) * 8 })}</p>
              <Button variant="tertiary" size="sm" onClick={next} className="shrink-0">
                {t('onb.activities.skip')}
              </Button>
            </div>
          )}
        </div>
      )}
    </OnboardingLayout>
  )
}
