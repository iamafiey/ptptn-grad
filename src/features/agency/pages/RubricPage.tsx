import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ChangeRequestList } from '@/components/agency/ChangeRequestList'
import { ChartCard, DataTableView, StackedBars } from '@/components/agency/Charts'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { proposeChange, rubricImpact, type ImpactRow, type RubricImpact } from '@/services/governance'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const EXAMPLE = 'Exco roles under 6 months cap at Working'

/** Rubric changes: draft → impact preview → second approver → publish. */
export default function RubricPage() {
  const { t } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const [rule, setRule] = useState('')
  const [impact, setImpact] = useState<RubricImpact | null>(null)
  const canAct = !readOnly && (role === 'aiGovernanceLead' || role === 'superAdmin')

  return (
    <AgencyPage title={t('agency.nav.rubric')} description={t('ai.rb.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-4">
          {canAct && (
            <Card>
              <Textarea
                label={t('ai.rb.draft')}
                placeholder={t('ai.rb.placeholder')}
                value={rule}
                onChange={(e) => {
                  setRule(e.target.value)
                  setImpact(null)
                }}
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<BarChart3 size={14} strokeWidth={1.5} />}
                  onClick={() => {
                    const text = rule.trim() || EXAMPLE
                    if (!rule.trim()) setRule(EXAMPLE)
                    setImpact(rubricImpact(text))
                  }}
                >
                  {t('ai.rb.preview')}
                </Button>
              </div>
            </Card>
          )}

          {impact && (
            <>
              <Card>
                <SectionLabel className="mb-3">
                  {t('ai.rb.preview')} · {t('ai.rb.sample', { n: impact.sample })}
                </SectionLabel>
                <dl className="grid grid-cols-3 gap-3">
                  {(['up', 'down', 'unchanged'] as const).map((k) => (
                    <div key={k} className="rounded-control bg-surface-muted p-3">
                      <dt className="t-caption text-ink-2">{t(`ai.rb.${k}`)}</dt>
                      <dd className="mt-1 t-heading">{formatNumber(impact[k])}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 t-caption font-normal text-ink-2">{t('ai.rb.notifyPreview', { n: impact.notified })}</p>
              </Card>
              <ImpactChart title={t('ai.rb.byInstitution')} rows={impact.byInstitution} />
              <ImpactChart title={t('ai.rb.byProgramme')} rows={impact.byProgramme} />
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    await proposeChange(officer, { kind: 'rubric', title: rule.trim(), detail: t('ai.rb.detail', { up: impact.up, down: impact.down, n: impact.sample }) })
                    setRule('')
                    setImpact(null)
                    toast(t('ai.rb.pending'))
                  }}
                >
                  {t('ai.rb.submit')}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          <ChangeRequestList kind="rubric" officer={officer} canAct={canAct} onApproved={(cr) => toast(t('ai.rb.published', { n: rubricImpact(cr.title).notified }))} />
          {canAct && <p className="mt-3 t-caption font-normal text-ink-3">{t('ai.rb.switchHint')}</p>}
        </div>
      </div>
    </AgencyPage>
  )
}

function ImpactChart({ title, rows }: { title: string; rows: ImpactRow[] }) {
  const { t } = useT()
  const series = [
    { key: 'down' as const, label: t('ai.rb.down'), color: 'var(--series-1)' },
    { key: 'up' as const, label: t('ai.rb.up'), color: 'var(--series-2)' },
  ]
  return (
    <ChartCard
      title={title}
      legend={series.map((s) => ({ label: s.label, color: s.color }))}
      chart={<StackedBars data={rows} x="group" series={series} height={200} />}
      table={<DataTableView columns={[t('ai.q.col.group'), t('ai.rb.up'), t('ai.rb.down'), t('ai.rb.unchanged')]} rows={rows.map((r) => [r.group, r.up, r.down, r.unchanged])} />}
    />
  )
}
