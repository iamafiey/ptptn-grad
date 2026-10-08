import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { SidePanel } from '@/components/agency/SidePanel'
import { SlaChip } from '@/components/agency/SlaChip'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { QUEUE_DEFS } from '@/data/agency'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { canWorkQueue, decideGeneric, getQueue, type QueueRow } from '@/services/agencyQueues'
import { useDemo } from '@/state/DemoProvider'
import type { QueueId } from '@/types/domain'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

/** Generic queue: case ID, anonymised subject, reason, AI recommendation + confidence, age, SLA → side panel. */
export default function QueuePage() {
  const { queueId } = useParams()
  const { t, lt, lang } = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const valid = QUEUE_DEFS.some((q) => q.id === queueId)
  const { data } = useAsync(() => (valid ? getQueue(queueId as QueueId, settings) : Promise.resolve(null)), [queueId, settings])
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)

  if (!valid) return <Navigate to="/a/home" replace />
  const canAct = !readOnly && canWorkQueue(role, queueId as QueueId)
  const open: QueueRow | null = data?.rows.find((r) => r.id === openId) ?? null

  const decide = async (action: 'approved' | 'rejected' | 'escalated', reason?: string) => {
    if (!open) return
    await decideGeneric(officer, open, action, reason)
    setOpenId(null)
    setRejecting(false)
    toast(t('ag.done'))
  }

  return (
    <AgencyPage title={data ? lt(data.def.title) : t('agency.page.queue')} description={data ? t('ag.showing', { count: data.rows.length }) : undefined}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <Card padded={false} className="overflow-hidden">
        {data && data.rows.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table>
            <THead>
              <Th>{t('ag.col.case')}</Th>
              <Th>{t('ag.col.subject')}</Th>
              <Th>{t('ag.col.reason')}</Th>
              <Th>{t('ag.col.ai')}</Th>
              <Th>{t('ag.col.age')}</Th>
              <Th>{t('ag.col.sla')}</Th>
            </THead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <Tr key={r.id} active={r.id === openId} onClick={() => (r.href ? navigate(r.href) : setOpenId(r.id))}>
                  <Td className="tabular text-ink-2">{r.id}</Td>
                  <Td>{r.subject}</Td>
                  <Td className="max-w-[320px]">{lt(r.reason)}</Td>
                  <Td className="whitespace-nowrap">{r.ai ? <span className="tabular">{t(`ag.ai.${r.ai.action}`)} · {r.ai.confidence.toFixed(2)}</span> : '—'}</Td>
                  <Td className="tabular">{t('ag.age', { count: r.age })}</Td>
                  <Td>
                    <SlaChip sla={r.sla} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SidePanel
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open ? t('ag.panel.title', { id: open.id }) : ''}
        subtitle={open?.subject}
        closeLabel={t('ag.panel.close')}
        footer={
          open && canAct ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => decide('escalated')}>
                {t('ag.action.escalate')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setRejecting(true)}>
                {t('ag.action.reject')}
              </Button>
              <Button size="sm" onClick={() => decide('approved')}>
                {t('ag.action.approve')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <SlaChip sla={open.sla} />
              <Chip tone="muted" size="sm">
                {t('ag.ageLong', { count: open.age })} · {formatDate(open.createdAt, lang, 'long')}
              </Chip>
            </div>
            <section>
              <SectionLabel className="mb-1">{t('ag.col.reason')}</SectionLabel>
              <p className="t-body">{lt(open.reason)}</p>
            </section>
            {open.ai && (
              <section className="rounded-control bg-surface-muted p-3">
                <SectionLabel className="mb-1">{t('ag.col.ai')}</SectionLabel>
                <p className="t-body-strong">
                  {t(`ag.ai.${open.ai.action}`)} · <span className="tabular">{open.ai.confidence.toFixed(2)}</span>
                </p>
                <p className="mt-1 text-ink-2">{open.ai.rationale}</p>
              </section>
            )}
            {open.detail.length > 0 && (
              <dl className="divide-y divide-hairline rounded-control border border-hairline px-3">
                {open.detail.map((d) => (
                  <div key={d.label} className="flex justify-between gap-4 py-2">
                    <dt className="text-ink-2">{d.label}</dt>
                    <dd className="text-right">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </SidePanel>
      <ReasonDialog open={rejecting} title={t('ag.action.reject')} confirmLabel={t('ag.confirm')} onCancel={() => setRejecting(false)} onConfirm={(r) => decide('rejected', r)} />
    </AgencyPage>
  )
}
