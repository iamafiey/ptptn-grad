import { useNavigate } from 'react-router'
import { AlertTriangle, ArrowRight, Info, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, SunriseCard } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { SlaChip } from '@/components/agency/SlaChip'
import { ALERTS, PULSE } from '@/data/agency'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { buildQueueSummaries } from '@/services/agencyQueues'
import { canUndo, recentActivity, undoAction } from '@/services/audit'
import { delay } from '@/services/delay'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const QUEUE_HREF: Partial<Record<string, string>> = {
  evidence: '/a/job-search/evidence',
  partnerRoleApprovals: '/a/partners/approvals',
  placements: '/a/job-search/placements',
}

/** Command centre: what needs my action today, and is the programme on track. Queues first. */
export default function AgencyHome() {
  const { t, lt, lang } = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => delay({ queues: buildQueueSummaries(role, settings), activity: recentActivity(officer.id) }, 150), [role, settings, officer.id])
  const alerts = ALERTS.filter((a) => a.roles.includes(role))

  return (
    <AgencyPage title={t('agency.page.home')}>
      <div className="space-y-8">
        {/* My queues */}
        {data && data.queues.length > 0 && (
          <section>
            <SectionLabel className="mb-3">{role === 'superAdmin' || readOnly ? t('ag.home.allQueues') : t('ag.home.queues')}</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.queues.map((q) => (
                <Card key={q.def.id} as="article" className="transition-shadow hover:shadow-2">
                  <button onClick={() => navigate(QUEUE_HREF[q.def.id] ?? `/a/queues/${q.def.id}`)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <p className="t-body-strong">{lt(q.def.title)}</p>
                      <SlaChip sla={q.sla} />
                    </div>
                    <p className="mt-2 t-heading">{formatNumber(q.count)}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 t-caption font-normal text-ink-2">
                      <span>{t('ag.home.oldest', { age: t('ag.ageLong', { count: q.oldest }) })}</span>
                      {q.overdue > 0 && <span className="text-attention-ink">{t('ag.home.overdue', { count: q.overdue })}</span>}
                      <span>SLA {q.def.slaWorkingDays === 0 ? lang === 'ms' ? 'hari sama' : 'same day' : t('ag.ageLong', { count: q.def.slaWorkingDays })}</span>
                    </p>
                  </button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Programme pulse — the one Sunrise surface in the agency workspace */}
        <SunriseCard>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="t-subheading">{t('ag.home.pulse')}</p>
            <p className="t-caption text-ink-2">{t('ag.home.pulseSub')}</p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            {PULSE.map((k) => {
              const delta = k.format === 'percent' ? k.value - k.previous : ((k.value - k.previous) / k.previous) * 100
              const deltaText = k.format === 'percent' ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts` : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
              return (
                <div key={k.id} className="rounded-control bg-surface/70 p-3">
                  <dt className="t-caption text-ink-2">{lt(k.label)}</dt>
                  {/* Large standalone figures use proportional digits (dataviz guidance). */}
                  <dd className="mt-1 t-heading">{k.format === 'percent' ? `${k.value}%` : formatNumber(k.value)}</dd>
                  <dd className="mt-1">
                    <Chip tone={delta >= 0 ? 'done' : 'attention'} size="sm">
                      {t('ag.home.vsLast', { delta: deltaText })}
                    </Chip>
                  </dd>
                </div>
              )
            })}
          </dl>
        </SunriseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Alerts */}
          <section>
            <SectionLabel className="mb-3">{t('ag.home.alerts')}</SectionLabel>
            <Card padded={false} className="divide-y divide-hairline">
              {alerts.map((a) => (
                <button key={a.id} onClick={() => navigate(a.link)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-muted">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-control ${a.severity === 'attention' ? 'bg-attention text-attention-ink' : 'bg-info text-info-ink'}`}>
                    {a.severity === 'attention' ? <AlertTriangle size={14} strokeWidth={1.5} /> : <Info size={14} strokeWidth={1.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-sm text-ink">{lt(a.message)}</span>
                    <span className="block t-caption font-normal text-ink-3">{formatDate(a.at, lang, 'weekday')}</span>
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} className="mt-1 text-ink-3" aria-hidden />
                </button>
              ))}
            </Card>
          </section>

          {/* Recent activity */}
          <section>
            <SectionLabel className="mb-3">{t('ag.home.activity')}</SectionLabel>
            <Card padded={false} className="divide-y divide-hairline">
              {(data?.activity ?? []).length === 0 && <p className="px-4 py-3 t-body-sm text-ink-2">{t('ag.home.noActivity')}</p>}
              {(data?.activity ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-body-sm text-ink">
                      {a.action} · <span className="tabular text-ink-2">{a.recordId}</span>
                    </span>
                    <span className="block truncate t-caption font-normal text-ink-3">
                      {formatDate(a.at, lang, 'weekday')}
                      {a.reason ? ` · ${a.reason}` : ''}
                    </span>
                  </span>
                  {canUndo(a.id) && !readOnly && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RotateCcw size={14} strokeWidth={1.5} />}
                      onClick={async () => {
                        await undoAction(officer, a.id)
                        toast(t('ag.home.undone'))
                      }}
                    >
                      {t('ag.home.undo')}
                    </Button>
                  )}
                </div>
              ))}
            </Card>
          </section>
        </div>
      </div>
    </AgencyPage>
  )
}
