import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Note } from '@/components/ui/Note'
import { ChartCard, DataTableView, StackedBars, TrendChart } from '@/components/agency/Charts'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { EVIDENCE_BY_PORTAL, EVIDENCE_DAILY } from '@/data/agency'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { AgencyPage } from '../shell/AgencyPage'

const pct = (n: number) => `${Math.round(n * 100)}%`

/** Evidence monitor: volume, auto-verified share, escalation rate, decision time, by portal; spike alert. */
export default function MonitorPage() {
  const { t, lang } = useT()
  const days = EVIDENCE_DAILY.map((d) => ({ ...d, label: formatDate(d.date, lang), escRate: Number(((d.escalated / d.total) * 100).toFixed(1)) }))
  const last7 = days.slice(-7)
  const sum = (k: 'total' | 'autoVerified' | 'escalated') => last7.reduce((s, d) => s + d[k], 0)
  const kpis = [
    { label: t('ag.mon.volume'), value: formatNumber(Math.round(sum('total') / 7)) },
    { label: t('ag.mon.autoShare'), value: pct(sum('autoVerified') / sum('total')) },
    { label: t('ag.mon.escalation'), value: pct(sum('escalated') / sum('total')) },
    { label: t('ag.mon.decision'), value: t('ag.mon.hours', { h: (last7.reduce((s, d) => s + d.decisionHours, 0) / 7).toFixed(1) }) },
  ]
  const series = [
    { key: 'autoVerified' as const, label: t('ag.mon.autoShare'), color: 'var(--series-2)' },
    { key: 'escalated' as const, label: t('ag.mon.escalated'), color: 'var(--series-1)' },
    { key: 'rejected' as const, label: t('ag.mon.rejected'), color: 'var(--series-3)' },
  ]

  return (
    <AgencyPage title={t('ag.mon.title')} description={t('ag.mon.lead')}>
      <div className="space-y-6">
        <Note tone="attention" icon={<AlertTriangle size={14} strokeWidth={1.5} />}>
          {t('ag.mon.spike')}
        </Note>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <dt className="t-caption text-ink-2">{k.label}</dt>
              <dd className="mt-1 t-heading">{k.value}</dd>
            </Card>
          ))}
        </dl>
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title={t('ag.mon.mix')}
            legend={series.map((s) => ({ label: s.label, color: s.color }))}
            chart={<StackedBars data={days} x="label" series={series} />}
            table={<DataTableView columns={[t('ag.mon.date'), ...series.map((s) => s.label)]} rows={days.map((d) => [d.label, d.autoVerified, d.escalated, d.rejected])} />}
          />
          <ChartCard
            title={t('ag.mon.escalation')}
            chart={<TrendChart data={days} x="label" y="escRate" label={t('ag.mon.escalation')} format={(v) => `${v}%`} />}
            table={<DataTableView columns={[t('ag.mon.date'), t('ag.mon.escalation')]} rows={days.map((d) => [d.label, `${d.escRate}%`])} />}
          />
        </div>
        <Card padded={false} className="overflow-hidden">
          <p className="px-4 pt-4 t-label text-ink-2">{t('ag.mon.byPortal')}</p>
          <Table minWidth={560} className="mt-3">
            <THead>
              <Th>{t('ag.mon.portal')}</Th>
              <Th className="text-right">{t('ag.mon.total')}</Th>
              <Th className="text-right">{t('ag.mon.autoShare')}</Th>
              <Th className="text-right">{t('ag.mon.escalation')}</Th>
            </THead>
            <tbody>
              {EVIDENCE_BY_PORTAL.map((p) => (
                <Tr key={p.portal}>
                  <Td>{p.portal}</Td>
                  <Td className="text-right tabular">{formatNumber(p.total)}</Td>
                  <Td className="text-right tabular">{pct(p.autoVerifiedPct)}</Td>
                  <Td className="text-right tabular">{pct(p.escalatedPct)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </AgencyPage>
  )
}
