import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { DataRequest } from '@/data/settingsAdmin'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { advanceRequest, getPdpa } from '@/services/settingsAdmin'
import { useDemo } from '@/state/DemoProvider'
import type { Officer } from '@/types/domain'

const TONE: Record<DataRequest['status'], ChipTone> = { open: 'pending', removedFromSearch: 'info', completed: 'done' }
const TODAY = '2026-10-07'
const daysLeft = (due: string) => Math.round((new Date(`${due}T00:00:00Z`).getTime() - new Date(`${TODAY}T00:00:00Z`).getTime()) / 86_400_000)

/** PDPA: consent records with text version, data request queue with deadlines, deletion flow, retention. */
export function PdpaTab({ officer, canEdit }: { officer: Officer; canEdit: boolean }) {
  const { t, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { data } = useAsync(() => getPdpa(), [])
  const nextLabel = (r: DataRequest) => (r.kind === 'deletion' ? (r.status === 'open' ? t('se.pdpa.removeFromSearch') : t('se.pdpa.deleteNow')) : t('se.pdpa.complete'))

  return (
    <div className="space-y-4">
      <Card padded={false} className="overflow-hidden">
        <SectionLabel className="px-5 pb-3 pt-5">{t('se.pdpa.requests')}</SectionLabel>
        <Table minWidth={760}>
          <THead>
            <Th>{t('ag.col.case')}</Th>
            <Th>{t('ag.col.subject')}</Th>
            <Th>{t('se.pdpa.kind')}</Th>
            <Th>{t('se.pdpa.due')}</Th>
            <Th>{t('pa.col.status')}</Th>
            <Th />
          </THead>
          <tbody>
            {(data?.requests ?? []).map((r) => (
              <Tr key={r.id}>
                <Td className="tabular text-ink-2">{r.id}</Td>
                <Td className="tabular">{r.studentCode}</Td>
                <Td>{t(`se.pdpa.k.${r.kind}`)}</Td>
                <Td className="whitespace-nowrap">
                  {formatDate(r.dueAt, lang, 'long')}
                  {r.status !== 'completed' && <span className="ml-2 t-caption text-ink-3">{t('se.pdpa.daysLeft', { count: daysLeft(r.dueAt) })}</span>}
                </Td>
                <Td>
                  <Chip tone={TONE[r.status]} size="sm">
                    {t(`se.pdpa.s.${r.status}`)}
                  </Chip>
                </Td>
                <Td className="text-right">
                  {canEdit && r.status !== 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        await advanceRequest(officer, r.id)
                        toast(t('ag.done'))
                      }}
                    >
                      {nextLabel(r)}
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <p className="px-5 py-3 t-caption font-normal text-ink-3">{t('se.pdpa.deletionFlow')}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false} className="overflow-hidden">
          <SectionLabel className="px-5 pb-3 pt-5">{t('se.pdpa.consents')}</SectionLabel>
          <Table minWidth={420}>
            <THead>
              <Th>{t('se.pdpa.version')}</Th>
              <Th>{t('se.pdpa.published')}</Th>
              <Th className="text-right">{t('se.pdpa.accepted')}</Th>
            </THead>
            <tbody>
              {(data?.consents ?? []).map((c) => (
                <Tr key={c.version}>
                  <Td className="t-body-strong">{c.version}</Td>
                  <Td>{formatDate(c.publishedAt, lang, 'long')}</Td>
                  <Td className="tabular text-right">{formatNumber(c.accepted)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card>
          <SectionLabel className="mb-3">{t('se.ps.g.retention')}</SectionLabel>
          <dl className="grid grid-cols-3 gap-3">
            {(['profileMonths', 'evidenceMonths', 'auditMonths'] as const).map((k) => (
              <div key={k}>
                <dt className="t-caption text-ink-2">{t(`se.ps.ret.${k}`)}</dt>
                <dd className="t-heading">{settings.retention[k]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 t-caption font-normal text-ink-3">{t('se.pdpa.retentionHint')}</p>
        </Card>
      </div>
    </div>
  )
}
