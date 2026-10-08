import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ChartCard, DataTableView, StackedBars } from '@/components/agency/Charts'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { COHORTS, cohortView } from '@/services/reports'
import { AgencyPage } from '../shell/AgencyPage'

/** Follow a graduation cohort month by month: visible → hired → repaying. */
export default function CohortPage() {
  const { t } = useT()
  const [cohort, setCohort] = useState('2025')
  const v = cohortView(cohort)
  const series = [
    { key: 'visible' as const, label: t('rp.co.visible'), color: 'var(--series-1)' },
    { key: 'hired' as const, label: t('rp.co.hired'), color: 'var(--series-3)' },
    { key: 'repaying' as const, label: t('rp.co.repaying'), color: 'var(--series-2)' },
  ]
  const stats: [string, string][] = [
    [t('rp.co.size'), formatNumber(v.size)],
    [t('rp.co.everHired'), `${v.everHired}%`],
    [t('rp.co.repayingNow'), `${v.repayingNow}%`],
    [t('rp.co.medianMonths'), v.medianMonthsToHire ? t('rp.co.months', { n: v.medianMonthsToHire }) : '—'],
  ]

  return (
    <AgencyPage title={t('agency.nav.cohort')} description={t('rp.cohort.desc')}>
      <Link to="/a/reports" className="mb-4 inline-flex items-center gap-1.5 t-caption text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.5} /> {t('agency.nav.allReports')}
      </Link>
      <SegmentedControl ariaLabel={t('ti.di.cohort')} className="mb-4 w-full max-w-md" value={cohort} onChange={setCohort} options={COHORTS.map((c) => ({ value: c, label: c }))} />
      <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([k, val]) => (
          <Card key={k}>
            <dt className="t-caption text-ink-2">{k}</dt>
            <dd className="mt-1 t-heading">{val}</dd>
          </Card>
        ))}
      </dl>
      <ChartCard
        title={t('rp.co.chart', { cohort })}
        legend={series.map((s) => ({ label: s.label, color: s.color }))}
        chart={<StackedBars data={v.months} x="month" series={series} height={280} />}
        table={<DataTableView columns={[t('rp.co.month'), ...series.map((s) => s.label)]} rows={v.months.map((m) => [m.month, `${m.visible}%`, `${m.hired}%`, `${m.repaying}%`])} />}
      />
      <p className="mt-3 t-caption font-normal text-ink-3">{t('rp.co.note')}</p>
    </AgencyPage>
  )
}
