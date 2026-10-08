import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ChartCard, DataTableView, StackedBars } from '@/components/agency/Charts'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { collectionsOverview, EW_MODEL_VERSION } from '@/services/collections'
import { delay } from '@/services/delay'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

/** Collections overview: who is slipping, what is due today, and whether the score treats groups fairly. */
export default function CollectionsOverviewPage() {
  const { t, lang } = useT()
  const { settings } = useDemo()
  const { readOnly } = useOfficer()
  const { data } = useAsync(() => delay(collectionsOverview(settings), 140), [settings])
  if (!data) return <AgencyPage title={t('col.ov.title')}>{null}</AgencyPage>

  const [b1, b2] = settings.collections.dpdBuckets
  const series = [
    { key: 'b1' as const, label: t('col.ov.dpd', { range: `1–${b1}` }), color: 'var(--series-1)' },
    { key: 'b2' as const, label: t('col.ov.dpd', { range: `${b1 + 1}–${b2}` }), color: 'var(--series-2)' },
    { key: 'b3' as const, label: t('col.ov.dpd', { range: `${b2 + 1}+` }), color: 'var(--series-3)' },
  ]
  const kpis = [
    { label: t('col.ov.onTime'), value: `${data.onTimePct}%` },
    { label: t('col.ov.watch'), value: formatNumber(data.watch) },
    { label: t('col.ov.high'), value: formatNumber(data.high) },
    { label: t('col.ov.recoveries'), value: formatNumber(data.recoveries) },
  ]
  const work = [
    { label: t('col.ov.callTasks'), value: data.callTasks, to: '/a/collections/service' },
    { label: t('col.ov.stepsDue'), value: data.stepsDue, to: '/a/collections/borrowers?view=stepsDue' },
    { label: t('col.ov.openCases'), value: data.openCases, to: '/a/collections/service' },
    { label: t('col.ov.promisesDue'), value: data.promisesDue, to: '/a/collections/borrowers?view=promises' },
  ]

  return (
    <AgencyPage title={t('col.ov.title')} description={t('col.ov.lead')}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="t-caption text-ink-2">{k.label}</p>
            <p className="mt-1 t-heading">{k.value}</p>
          </Card>
        ))}
      </div>
      <p className="mt-2 t-caption font-normal text-ink-3">{t('col.ov.sample', { n: data.sample })}</p>

      {!readOnly && (
        <section className="mt-6">
          <SectionLabel className="mb-3">{t('col.ov.today')}</SectionLabel>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {work.map((w) => (
              <Card key={w.label} padded={false}>
                <Link to={w.to} className="flex items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block t-caption text-ink-2">{w.label}</span>
                    <span className="mt-1 block t-heading">{formatNumber(w.value)}</span>
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 text-ink-3" aria-hidden />
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={t('col.ov.trend')}
          legend={series.map((s) => ({ label: s.label, color: s.color }))}
          chart={<StackedBars data={data.trend.map((r) => ({ ...r, month: formatDate(`${r.month}-01`, lang, 'mon') }))} x="month" series={series} />}
          table={<DataTableView columns={[t('ti.di.month'), ...series.map((s) => s.label)]} rows={data.trend.map((r) => [r.month, r.b1, r.b2, r.b3])} />}
        />
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionLabel>{t('col.ov.segments')}</SectionLabel>
          </div>
          <Table minWidth={420}>
            <THead>
              <Th>{t('col.col.segment')}</Th>
              <Th>{t('col.ov.inSample')}</Th>
              <Th>{t('col.ov.action')}</Th>
            </THead>
            <tbody>
              {data.bySegment.map((x) => (
                <Tr key={x.segment}>
                  <Td>{t(`col.seg.${x.segment}`)}</Td>
                  <Td className="tabular">{x.count}</Td>
                  <Td className="text-ink-2">{t(`col.segAction.${x.segment}`)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionLabel className="mb-3">{t('col.ov.fairness')}</SectionLabel>
        <p className="mb-3 t-body-sm text-ink-2">{t('col.ov.fairnessLead')}</p>
        <Table minWidth={480}>
          <THead>
            <Th>{t('st.filter.institution')}</Th>
            <Th>{t('col.ov.inSample')}</Th>
            <Th>{t('col.ov.highShare')}</Th>
            <Th>{t('col.ov.check')}</Th>
          </THead>
          <tbody>
            {data.fairness.map((f) => (
              <Tr key={f.group}>
                <Td>{f.group}</Td>
                <Td className="tabular">{f.borrowers}</Td>
                <Td className="tabular">{Math.round(f.highShare * 100)}%</Td>
                <Td>
                  <Chip tone={f.flagged ? 'pending' : 'done'} size="sm">
                    {f.flagged ? t('col.ov.review') : t('col.ov.ok')}
                  </Chip>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Note tone="muted" className="mt-4">
          {t('col.ov.model', { model: EW_MODEL_VERSION })}
        </Note>
      </Card>
    </AgencyPage>
  )
}
