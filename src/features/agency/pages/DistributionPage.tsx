import { ChartCard, DataTableView, StackedBars, TrendChart } from '@/components/agency/Charts'
import { useT } from '@/i18n'
import { distribution } from '@/services/tiersAdmin'
import { AgencyPage } from '../shell/AgencyPage'

/** Tier distribution by cohort and monthly Tier B → A recoveries. */
export default function DistributionPage() {
  const { t } = useT()
  const { byCohort, recoveries } = distribution()
  const series = [
    { key: 'tierA' as const, label: t('ti.v.tierA'), color: 'var(--series-2)' },
    { key: 'tierB' as const, label: t('ti.v.tierB'), color: 'var(--series-1)' },
  ]
  return (
    <AgencyPage title={t('agency.nav.distribution')} description={t('ti.di.lead')}>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={t('ti.di.byCohort')}
          legend={series.map((s) => ({ label: s.label, color: s.color }))}
          chart={<StackedBars data={byCohort} x="cohort" series={series} />}
          table={<DataTableView columns={[t('ti.di.cohort'), t('ti.v.tierA'), t('ti.v.tierB')]} rows={byCohort.map((r) => [r.cohort, `${r.tierA}%`, `${r.tierB}%`])} />}
        />
        <ChartCard
          title={t('ti.di.recoveries')}
          chart={<TrendChart data={recoveries} x="month" y="recoveries" label={t('ti.di.recoveries')} height={220} />}
          table={<DataTableView columns={[t('ti.di.month'), t('ti.di.recoveries')]} rows={recoveries.map((r) => [r.month, r.recoveries])} />}
        />
      </div>
      <p className="mt-3 t-caption font-normal text-ink-3">{t('ti.di.partial')}</p>
    </AgencyPage>
  )
}
