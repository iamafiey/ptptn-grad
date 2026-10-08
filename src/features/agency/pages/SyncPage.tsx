import { useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getSync, retrySync } from '@/services/tiersAdmin'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const fmtTime = (iso: string, lang: 'en' | 'ms') =>
  new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-MY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(iso))

/** Repayment sync monitor. Missing data never downgrades a student. */
export default function SyncPage() {
  const { t, lang } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => getSync(), [])
  const [busy, setBusy] = useState(false)
  const canAct = !readOnly && (role === 'collectionLiaison' || role === 'superAdmin')
  const last = data?.last

  return (
    <AgencyPage
      title={t('agency.nav.sync')}
      description={t('ti.sync.lead')}
      actions={
        canAct &&
        last?.state === 'failed' && (
          <Button
            size="sm"
            icon={<RefreshCw size={14} strokeWidth={1.5} className={busy ? 'animate-spin' : undefined} />}
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await retrySync(officer)
              setBusy(false)
              toast(t('ti.sync.retried'))
            }}
          >
            {t('ti.sync.retry')}
          </Button>
        )
      }
    >
      {last && (
        <>
          {last.state === 'failed' && (
            <Note tone="attention" icon={<AlertTriangle size={14} strokeWidth={1.5} />} className="mb-4">
              {last.note} · {t('ti.sync.keepTier')}
            </Note>
          )}
          <Card>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="t-caption text-ink-2">{t('ti.sync.last')}</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="t-body-strong">{fmtTime(last.at, lang)}</span>
                  <Chip tone={last.state === 'ok' ? 'done' : 'attention'} size="sm">
                    {t(`ti.sync.state.${last.state}`)}
                  </Chip>
                </dd>
              </div>
              <div>
                <dt className="t-caption text-ink-2">{t('ti.sync.records')}</dt>
                <dd className="mt-1 t-heading">{formatNumber(last.records)}</dd>
              </div>
              <div>
                <dt className="t-caption text-ink-2">{t('ti.sync.errors')}</dt>
                <dd className="mt-1 t-heading">{last.errors}</dd>
              </div>
            </dl>
          </Card>
        </>
      )}

      <SectionLabel className="mb-3 mt-6">{t('ti.sync.history')}</SectionLabel>
      <Card padded={false} className="overflow-hidden">
        <Table minWidth={620}>
          <THead>
            <Th>{t('ti.sync.last')}</Th>
            <Th>{t('pa.col.status')}</Th>
            <Th className="text-right">{t('ti.sync.records')}</Th>
            <Th className="text-right">{t('ti.sync.errors')}</Th>
            <Th>{t('ti.sync.note')}</Th>
          </THead>
          <tbody>
            {(data?.history ?? []).slice(0, 7).map((r) => (
              <Tr key={r.at}>
                <Td className="whitespace-nowrap">{fmtTime(r.at, lang)}</Td>
                <Td>
                  <Chip tone={r.state === 'ok' ? 'done' : 'attention'} size="sm">
                    {t(`ti.sync.state.${r.state}`)}
                  </Chip>
                </Td>
                <Td className="tabular text-right">{formatNumber(r.records)}</Td>
                <Td className="tabular text-right">{r.errors}</Td>
                <Td className="text-ink-2">{r.note ?? '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AgencyPage>
  )
}
