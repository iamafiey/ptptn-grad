import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LogoTile } from '@/components/ui/Tiles'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { matchingStats } from '@/services/partnersAdmin'
import { AgencyPage } from '../shell/AgencyPage'

/** Matching monitor: views → invitations → acceptances → hires, and who partners never see. */
export default function MatchingPage() {
  const { t, lt } = useT()
  const { rows, totals, unseen } = matchingStats()
  const steps = [
    { label: t('ma.views'), value: totals.views },
    { label: t('ma.invitations'), value: totals.invitations },
    { label: t('ma.acceptances'), value: totals.acceptances },
    { label: t('ma.hires'), value: totals.hires },
  ]
  const maxUnseen = Math.max(...unseen.byInstitutionType.map((g) => g.count))

  return (
    <AgencyPage title={t('agency.nav.matching')} description={t('ma.lead')}>
      <Card>
        <SectionLabel className="mb-3">{t('ma.funnel')}</SectionLabel>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.label} className="rounded-control bg-surface-muted p-3">
              <dt className="t-caption text-ink-2">{s.label}</dt>
              <dd className="mt-1 t-heading">{formatNumber(s.value)}</dd>
              {i > 0 && <dd className="t-caption font-normal text-ink-3">{t('ma.conversion', { pct: ((s.value / steps[i - 1].value) * 100).toFixed(1) })}</dd>}
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card padded={false} className="overflow-hidden">
          <Table minWidth={620}>
            <THead>
              <Th>{t('pa.col.partner')}</Th>
              <Th className="text-right">{t('ma.views')}</Th>
              <Th className="text-right">{t('ma.invitations')}</Th>
              <Th className="text-right">{t('ma.acceptances')}</Th>
              <Th className="text-right">{t('ma.hires')}</Th>
            </THead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.partner.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <LogoTile monogram={r.partner.monogram} size={28} />
                      {r.partner.name}
                    </span>
                  </Td>
                  <Td className="tabular text-right">{formatNumber(r.views)}</Td>
                  <Td className="tabular text-right">{formatNumber(r.invitations)}</Td>
                  <Td className="tabular text-right">{formatNumber(r.acceptances)}</Td>
                  <Td className="tabular text-right">{r.hires}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <SectionLabel className="mb-1">{t('ma.unseen')}</SectionLabel>
          <p className="t-heading">{t('ma.unseenCount', { count: formatNumber(unseen.total) })}</p>
          <p className="mt-1 t-body-sm text-ink-2">{lt(unseen.note)}</p>
          <ul className="mt-4 space-y-3">
            {unseen.byInstitutionType.map((g) => (
              <li key={g.group}>
                <div className="flex justify-between t-body-sm">
                  <span>{g.group}</span>
                  <span className="tabular">{formatNumber(g.count)}</span>
                </div>
                <div className="mt-1 h-2 rounded-chip bg-surface-muted">
                  <div className="h-2 rounded-chip" style={{ width: `${(g.count / maxUnseen) * 100}%`, background: 'var(--series-1)' }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AgencyPage>
  )
}
