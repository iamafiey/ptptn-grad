import { useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ChartCard, DataTableView, TrendChart } from '@/components/agency/Charts'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { FairnessRow } from '@/data/agency6'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { fairnessFlags, getQuality, reviewSample } from '@/services/quality'
import { skillById } from '@/services/taxonomy'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

/** Quality and fairness: sample review, agreement vs threshold, fairness by institution type and state. */
export default function QualityPage() {
  const { t, lt } = useT()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => getQuality(), [])
  const [verdicts, setVerdicts] = useState<Record<string, 'agree' | 'disagree'>>({})
  const canAct = !readOnly && (role === 'aiGovernanceLead' || role === 'superAdmin')
  if (!data) return <AgencyPage title={t('agency.nav.quality')}>{null}</AgencyPage>

  const threshold = settings.ai.agreementAlertThreshold
  const latest = data.agreement[data.agreement.length - 1].agreement

  return (
    <AgencyPage title={t('agency.nav.quality')} description={t('ai.q.lead')}>
      {latest < threshold && (
        <Note tone="attention" icon={<AlertTriangle size={14} strokeWidth={1.5} />} className="mb-4">
          {t('ai.q.belowThreshold', { pct: latest, threshold })}
        </Note>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={`${t('ai.q.agreement')} (%)`}
          chart={<TrendChart data={data.agreement} x="week" y="agreement" label={t('ai.q.agreement')} format={(v) => `${v}%`} domain={[80, 100]} height={300} />}
          table={<DataTableView columns={[t('ai.q.week'), t('ai.q.agreement')]} rows={data.agreement.map((w) => [w.week, `${w.agreement}%`])} />}
        />
        <Card padded={false} className="overflow-hidden">
          <SectionLabel className="px-5 pb-3 pt-5">{t('ai.q.sample')}</SectionLabel>
          <ul className="divide-y divide-hairline border-t border-hairline">
            {data.sample.map((s) => {
              const v = verdicts[s.id]
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="t-body-sm">
                      <span className="t-body-strong">{lt(skillById(s.skillId)?.name ?? { en: s.skillId })}</span> · {t(`skill.level.${s.aiLevel}`)}
                    </p>
                    <p className="t-caption font-normal text-ink-3">
                      {s.studentCode} · {s.source}
                    </p>
                  </div>
                  {v ? (
                    <Chip tone={v === 'agree' ? 'done' : 'attention'} size="sm">
                      {t(`ai.q.${v}`)}
                    </Chip>
                  ) : (
                    canAct && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<X size={14} strokeWidth={1.5} />}
                          onClick={() => {
                            reviewSample(officer, s.id, 'disagree')
                            setVerdicts((x) => ({ ...x, [s.id]: 'disagree' }))
                          }}
                        >
                          {t('ai.q.disagree')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Check size={14} strokeWidth={1.5} />}
                          onClick={() => {
                            reviewSample(officer, s.id, 'agree')
                            setVerdicts((x) => ({ ...x, [s.id]: 'agree' }))
                          }}
                        >
                          {t('ai.q.agree')}
                        </Button>
                      </div>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <SectionLabel className="mb-3 mt-8">{t('ai.q.fairness')}</SectionLabel>
      <div className="space-y-4">
        <FairnessTable title={t('ai.q.fairnessInst')} rows={data.fairnessInstitution} />
        <FairnessTable title={t('ai.q.fairnessState')} rows={data.fairnessState} />
        <Card>
          <p className="t-body-sm">
            {t('ai.q.holds')}: <span className="t-body-strong tabular">{formatNumber(data.holds)}</span>
          </p>
        </Card>
      </div>
    </AgencyPage>
  )
}

function FairnessTable({ title, rows }: { title: string; rows: FairnessRow[] }) {
  const { t } = useT()
  const flagged = fairnessFlags(rows)
  return (
    <Card padded={false} className="overflow-hidden">
      <p className="px-5 pb-3 pt-4 t-body-strong">{title}</p>
      <Table minWidth={720}>
        <THead>
          <Th>{t('ai.q.col.group')}</Th>
          <Th className="text-right">{t('ai.q.col.students')}</Th>
          <Th className="text-right">{t('ai.q.col.skills')}</Th>
          <Th className="text-right">{t('ai.q.col.advanced')}</Th>
          <Th className="text-right">{t('ai.q.col.confidence')}</Th>
          <Th className="text-right">{t('ai.q.col.disputes')}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.group}>
              <Td>
                {r.group}
                {flagged.has(r.group) && (
                  <Chip tone="attention" size="sm" className="ml-2" icon={<AlertTriangle size={11} strokeWidth={1.5} />}>
                    {t('ai.q.gapFlag')}
                  </Chip>
                )}
              </Td>
              <Td className="tabular text-right">{formatNumber(r.students)}</Td>
              <Td className="tabular text-right">{r.avgSkills.toFixed(1)}</Td>
              <Td className="tabular text-right">{Math.round(r.advancedShare * 100)}%</Td>
              <Td className="tabular text-right">{r.avgConfidence.toFixed(2)}</Td>
              <Td className="tabular text-right">{(r.disputeRate * 100).toFixed(1)}%</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}
