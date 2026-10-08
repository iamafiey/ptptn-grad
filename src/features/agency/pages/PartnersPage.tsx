import { useNavigate } from 'react-router'
import { AlertTriangle, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LogoTile } from '@/components/ui/Tiles'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { listPartners } from '@/services/partnersAdmin'
import { partnerStatusKey, STATUS_TONE } from '../tones'
import { AgencyPage } from '../shell/AgencyPage'

/** Talent Partner directory with the commitment tracker. */
export default function PartnersPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { data } = useAsync(() => listPartners(), [])

  return (
    <AgencyPage title={t('agency.nav.talentPartners')} description={t('pa.lead')}>
      <Card padded={false} className="overflow-hidden">
        <Table minWidth={1040}>
          <THead>
            <Th>{t('pa.col.partner')}</Th>
            <Th>{t('pa.col.status')}</Th>
            <Th>{t('pa.col.roles')}</Th>
            <Th>{t('pa.col.invitations')}</Th>
            <Th>{t('pa.col.acceptance')}</Th>
            <Th>{t('pa.col.hires')}</Th>
            <Th>{t('pa.col.response')}</Th>
            <Th>{t('pa.col.complaints')}</Th>
          </THead>
          <tbody>
            {(data ?? []).map((r) => {
              const p = r.partner
              const sk = partnerStatusKey(p)
              return (
                <Tr key={p.id} onClick={() => navigate(`/a/partners/${p.id}`)}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <LogoTile monogram={p.monogram} size={32} />
                      <span className="min-w-0">
                        <span className="block t-body-strong">{p.name}</span>
                        <span className="block t-caption font-normal text-ink-3">{p.sector}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Chip tone={STATUS_TONE[sk]} size="sm">
                      {t(`ag.partnerStatus.${sk}`)}
                    </Chip>
                  </Td>
                  <Td>
                    <span className="tabular">
                      {p.metrics.rolesPosted} / {r.committedToDate}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {r.behindOnRoles && (
                        <Chip tone="attention" size="sm" icon={<AlertTriangle size={11} strokeWidth={1.5} />}>
                          {t('pa.flag.behind')}
                        </Chip>
                      )}
                    </span>
                  </Td>
                  <Td className="tabular">{formatNumber(p.metrics.invitations)}</Td>
                  <Td className="tabular">{p.metrics.invitations ? `${Math.round(p.metrics.acceptanceRate * 100)}%` : '—'}</Td>
                  <Td className="tabular">{p.metrics.hires}</Td>
                  <Td>
                    <span className="tabular">{p.metrics.invitations ? t('pa.hours', { h: p.metrics.avgResponseHours }) : '—'}</span>
                    {r.slowToRespond && (
                      <Chip tone="pending" size="sm" className="ml-2" icon={<Clock size={11} strokeWidth={1.5} />}>
                        {t('pa.flag.slow')}
                      </Chip>
                    )}
                  </Td>
                  <Td className="tabular">{p.metrics.complaints}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </AgencyPage>
  )
}
