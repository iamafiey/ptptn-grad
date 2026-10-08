import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Field } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n'
import { logAudit } from '@/services/audit'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const TYPES = ['confirmationEmail', 'screenshot', 'interviewInvite', 'offerLetter'] as const
const CHECKS = ['readable', 'companyExists', 'matchesEntry', 'dateInPeriod', 'duplicateImage', 'editedImage'] as const
/** Deterministic estimate of the escalated share at a given threshold. */
const escalatedPct = (thr: number) => Math.round(2 + (thr - 0.6) * 40)

/** Evidence rules: accepted types, application period and the auto-verify confidence threshold. Changes are audited. */
export default function EvidenceRulesPage() {
  const { t } = useT()
  const toast = useToast()
  const { settings, updateSettings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const canAct = !readOnly && (role === 'aiGovernanceLead' || role === 'superAdmin')
  const [thr, setThr] = useState(settings.evidence.autoVerifyConfidence)
  const [period, setPeriod] = useState(settings.evidence.applicationPeriodDays)
  const [types, setTypes] = useState<string[]>(settings.evidence.acceptedTypes)
  const dirty = thr !== settings.evidence.autoVerifyConfidence || period !== settings.evidence.applicationPeriodDays || types.join() !== settings.evidence.acceptedTypes.join()

  const save = () => {
    const before = settings.evidence
    updateSettings((s) => ({ ...s, evidence: { autoVerifyConfidence: thr, applicationPeriodDays: period, acceptedTypes: types } }))
    logAudit(officer, 'Updated evidence rules', 'settings', 'evidence', `Threshold ${before.autoVerifyConfidence.toFixed(2)} → ${thr.toFixed(2)}; period ${before.applicationPeriodDays} → ${period} days; types ${types.length}`)
    toast(t('ai.er.saved'))
  }

  return (
    <AgencyPage title={t('agency.nav.evidenceRules')} description={t('ai.er.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <label htmlFor="thr" className="t-body-strong">
            {t('ai.er.threshold')}
          </label>
          <div className="mt-3 flex items-center gap-4">
            <input id="thr" type="range" min={0.6} max={0.95} step={0.01} value={thr} disabled={!canAct} onChange={(e) => setThr(Number(e.target.value))} className="w-full accent-[var(--ink)]" />
            <span className="w-12 text-right t-heading tabular">{thr.toFixed(2)}</span>
          </div>
          <p className="mt-2 t-caption font-normal text-ink-2">{t('ai.er.thresholdHint', { pct: escalatedPct(thr) })}</p>

          <div className="mt-5">
            <Field label={t('ai.er.period')} type="number" min={30} max={180} value={period} disabled={!canAct} onChange={(e) => setPeriod(Number(e.target.value) || 90)} />
          </div>

          <div className="mt-5">
            <ChipSelect multiple label={t('ai.er.types')} value={types} onChange={(v) => canAct && v.length > 0 && setTypes(v)} options={TYPES.map((x) => ({ value: x, label: t(`ai.er.type.${x}`) }))} />
          </div>

          {canAct && (
            <div className="mt-5 flex justify-end">
              <Button disabled={!dirty} onClick={save}>
                {t('ai.er.save')}
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <SectionLabel className="mb-3">{t('ai.er.checks')}</SectionLabel>
          <ul className="space-y-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2 t-body-sm">
                <Check size={16} strokeWidth={1.5} className="text-done-ink" aria-hidden />
                {t(`ai.er.check.${c}`)}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AgencyPage>
  )
}
