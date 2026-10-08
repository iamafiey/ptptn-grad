import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SlaChip } from '@/components/agency/SlaChip'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { buildQueueSummaries } from '@/services/agencyQueues'
import { getPlacements } from '@/services/placements'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'

/** Placements: partner hires (auto-verified) and open-market hires (evidence), plus the confirmations queue. */
export default function PlacementsPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { settings } = useDemo()
  const { data } = useAsync(() => getPlacements(), [])
  const q = buildQueueSummaries('superAdmin', settings).find((x) => x.def.id === 'placements')!

  return (
    <AgencyPage title={t('ag.pl.title')} description={t('ag.pl.lead')}>
      <div className="space-y-6">
        <Card as="article">
          <button onClick={() => navigate('/a/queues/placements')} className="flex w-full items-center gap-4 text-left">
            <div className="flex-1">
              <p className="t-body-strong">{t('ag.pl.confirmations')}</p>
              <p className="t-caption font-normal text-ink-2">
                {t('ag.showing', { count: q.count })} · {t('ag.home.oldest', { age: t('ag.ageLong', { count: q.oldest }) })}
              </p>
            </div>
            <SlaChip sla={q.sla} />
            <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
          </button>
        </Card>
        <Note tone="muted">{settings.placements.triggerRepaymentSetup ? t('ag.pl.repaymentNoteOn') : t('ag.pl.repaymentNote')}</Note>
        <section>
          <SectionLabel className="mb-3">{t('ag.pl.recent')}</SectionLabel>
          <Card padded={false} className="overflow-hidden">
            <Table minWidth={860}>
              <THead>
                <Th>{t('ag.col.subject')}</Th>
                <Th>{t('ag.pl.employer')}</Th>
                <Th>{t('ag.pl.role')}</Th>
                <Th>{t('ag.pl.salary')}</Th>
                <Th>{t('ag.pl.start')}</Th>
                <Th>{t('ag.pl.source')}</Th>
                <Th className="text-right">{t('ag.pl.days')}</Th>
                <Th>{t('ag.pl.status')}</Th>
              </THead>
              <tbody>
                {(data ?? []).map((p) => (
                  <Tr key={p.id}>
                    <Td className="tabular text-ink-2">{p.studentId}</Td>
                    <Td>{p.employer}</Td>
                    <Td>{p.role}</Td>
                    <Td className="whitespace-nowrap tabular">{p.salaryBand}</Td>
                    <Td className="whitespace-nowrap">{formatDate(p.startDate, lang, 'long')}</Td>
                    <Td>{t(`ag.pl.source.${p.source}`)}</Td>
                    <Td className="text-right tabular">{p.daysToHire}</Td>
                    <Td>
                      <Chip tone={p.verification === 'pending' ? 'pending' : 'done'} size="sm">
                        {t(`ag.pl.v.${p.verification}`)}
                      </Chip>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>
      </div>
    </AgencyPage>
  )
}
