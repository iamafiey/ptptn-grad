import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Field, Toggle } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import type { ProgrammeSettings } from '@/config/programmeSettings'
import { useT } from '@/i18n'
import { logAudit } from '@/services/audit'
import { useDemo } from '@/state/DemoProvider'
import type { Officer, QueueId } from '@/types/domain'

const QUEUES: QueueId[] = ['evidence', 'placements', 'partnerRoleApprovals', 'partnerApplications', 'portalFeedIssues', 'skillDisputes', 'lowConfidence', 'tierOverrides', 'courseSubmissions']
const GROUPS = ['sla', 'partners', 'placements', 'jobSeeking', 'records', 'taxonomy', 'retention', 'ai', 'student'] as const

/** Every open decision from the specs as a live setting. Saving applies it everywhere and is audited. */
export function ProgrammeTab({ officer, canEdit }: { officer: Officer; canEdit: boolean }) {
  const { t } = useT()
  const toast = useToast()
  const { settings, updateSettings } = useDemo()
  const [d, setD] = useState<ProgrammeSettings>(settings)
  const changed = GROUPS.filter((g) => JSON.stringify(d[g]) !== JSON.stringify(settings[g]))
  const set = <K extends keyof ProgrammeSettings>(k: K, patch: Partial<ProgrammeSettings[K]>) => setD((x) => ({ ...x, [k]: { ...(x[k] as object), ...patch } }))
  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : fallback)

  const save = () => {
    updateSettings((s) => ({ ...s, ...Object.fromEntries(changed.map((g) => [g, d[g]])) }))
    logAudit(officer, 'Changed programme settings', 'settings', changed.join(', '), changed.map((g) => t(`se.ps.g.${g}`)).join(', '))
    toast(t('se.ps.saved'))
  }

  return (
    <div className="space-y-4">
      <Note tone="info">{t('se.ps.lead')}</Note>
      <div className="grid gap-4 xl:grid-cols-2">
        <Group title={t('se.ps.g.sla')}>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUEUES.map((q) => (
              <Field key={q} label={t(`se.ps.queue.${q}`)} type="number" min={0} max={20} disabled={!canEdit} value={d.sla[q]} onChange={(e) => set('sla', { [q]: num(e.target.value, d.sla[q]) })} />
            ))}
          </div>
          <p className="t-caption font-normal text-ink-3">{t('se.ps.sameDay')}</p>
        </Group>

        <div className="space-y-4">
          <Group title={t('se.ps.g.partners')}>
            <Field label={t('pa.salaryFloor')} prefix="RM" type="number" min={0} step={100} disabled={!canEdit} value={d.partners.salaryFloorRM} onChange={(e) => set('partners', { salaryFloorRM: num(e.target.value, d.partners.salaryFloorRM) })} />
            <ChipSelect
              multiple
              label={t('se.ps.contracts')}
              value={d.partners.allowedContractTypes}
              onChange={(v) => canEdit && v.length > 0 && set('partners', { allowedContractTypes: v })}
              options={(['permanent', 'graduateProgramme', 'contract'] as const).map((c) => ({ value: c, label: t(`role.contract.${c}`) }))}
            />
            <Field label={t('se.ps.probation')} type="number" min={0} disabled={!canEdit} value={d.partners.probationDays} onChange={(e) => set('partners', { probationDays: num(e.target.value, d.partners.probationDays) })} />
          </Group>
          <Group title={t('se.ps.g.placements')}>
            <Toggle checked={d.placements.triggerRepaymentSetup} onChange={(v) => canEdit && set('placements', { triggerRepaymentSetup: v })} label={t('se.ps.triggerRepayment')} description={t('se.ps.triggerRepaymentDesc')} />
          </Group>
        </div>

        <Group title={t('se.ps.g.jobSeeking')}>
          <Field label={t('ti.r.threshold')} type="number" min={1} max={20} disabled={!canEdit} value={d.jobSeeking.monthlyThreshold} onChange={(e) => set('jobSeeking', { monthlyThreshold: num(e.target.value, d.jobSeeking.monthlyThreshold) })} />
          <Toggle checked={d.jobSeeking.supportsDeferment} onChange={(v) => canEdit && set('jobSeeking', { supportsDeferment: v })} label={t('se.ps.supportsDeferment')} />
        </Group>

        <Group title={t('se.ps.g.data')}>
          <Select label={t('se.ps.universitySource')} disabled={!canEdit} value={d.records.universitySource} onChange={(e) => set('records', { universitySource: e.target.value as ProgrammeSettings['records']['universitySource'] })} options={[{ value: 'uploadOnly', label: t('se.ps.src.uploadOnly') }, { value: 'integration', label: t('se.ps.src.integration') }]} />
          <Select label={t('se.ps.taxonomySource')} disabled={!canEdit} value={d.taxonomy.source} onChange={(e) => set('taxonomy', { source: e.target.value as ProgrammeSettings['taxonomy']['source'] })} options={[{ value: 'own', label: t('ai.tax.source.own') }, { value: 'alignedNational', label: t('ai.tax.source.alignedNational') }]} />
          <Toggle checked={d.student.visibilityStartsFinalSemester} onChange={(v) => canEdit && set('student', { visibilityStartsFinalSemester: v })} label={t('se.ps.finalSemester')} />
        </Group>

        <Group title={t('se.ps.g.retention')}>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['profileMonths', 'evidenceMonths', 'auditMonths'] as const).map((k) => (
              <Field key={k} label={t(`se.ps.ret.${k}`)} type="number" min={1} disabled={!canEdit} value={d.retention[k]} onChange={(e) => set('retention', { [k]: num(e.target.value, d.retention[k]) })} />
            ))}
          </div>
        </Group>

        <Group title={t('se.ps.g.ai')}>
          <Field label={t('se.ps.lowConfidence')} type="number" step={0.05} min={0} max={1} disabled={!canEdit} value={d.ai.lowConfidenceThreshold} onChange={(e) => set('ai', { lowConfidenceThreshold: num(e.target.value, d.ai.lowConfidenceThreshold) })} />
          <Field label={t('se.ps.agreementAlert')} type="number" min={50} max={100} disabled={!canEdit} value={d.ai.agreementAlertThreshold} onChange={(e) => set('ai', { agreementAlertThreshold: num(e.target.value, d.ai.agreementAlertThreshold) })} />
        </Group>

        <Group title={t('se.ps.g.elsewhere')}>
          <ul className="space-y-2 t-body-sm">
            {(
              [
                ['/a/tiers', 'se.ps.link.tiers'],
                ['/a/ai/evidence-rules', 'se.ps.link.evidence'],
                ['/a/partners/portals', 'se.ps.link.portals'],
              ] as const
            ).map(([to, key]) => (
              <li key={to}>
                <Link to={to} className="inline-flex items-center gap-1.5 text-ink hover:underline">
                  {t(key)} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      </div>

      {canEdit && changed.length > 0 && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-card border border-hairline bg-surface p-3 shadow-2">
          <span className="t-caption text-ink-2">{t('se.ps.unsaved', { count: changed.length })}</span>
          <Button variant="secondary" size="sm" onClick={() => setD(settings)}>
            {t('se.ps.discard')}
          </Button>
          <Button size="sm" onClick={save}>
            {t('se.ps.save')}
          </Button>
        </div>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <SectionLabel className="mb-3">{title}</SectionLabel>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}
