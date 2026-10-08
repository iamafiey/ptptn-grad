import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Flag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { SidePanel } from '@/components/agency/SidePanel'
import { SlaChip } from '@/components/agency/SlaChip'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { canWorkQueue } from '@/services/agencyQueues'
import { decideEvidence, getEvidenceQueue, type EvidenceDecision, type EvidenceQueueItem } from '@/services/evidenceReview'
import { useDemo } from '@/state/DemoProvider'
import { CheckDetails } from '@/features/student/opportunities/EvidenceCheck'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

type Filter = 'all' | 'overdue' | 'demo'

/** Evidence the AI couldn't verify: evidence beside AI-extracted fields → Verify, Reject with reason, Flag account. */
export default function EvidencePage() {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, setPending] = useState<EvidenceDecision | null>(null)
  const { data } = useAsync(() => getEvidenceQueue(settings), [settings])
  const canAct = !readOnly && canWorkQueue(role, 'evidence')

  const rows = (data ?? []).filter((r) => (filter === 'overdue' ? r.sla === 'overdue' : filter === 'demo' ? !!r.studentId : true))
  const openId = params.get('case')
  const open: EvidenceQueueItem | null = data?.find((r) => r.id === openId) ?? null
  const setOpen = (id: string | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('case', id)
    else p.delete('case')
    setParams(p, { replace: true })
  }

  const decide = async (d: EvidenceDecision, reason?: string) => {
    if (!open) return
    await decideEvidence(officer, open, d, reason)
    setPending(null)
    setOpen(null)
    toast(t('ag.done'))
  }

  return (
    <AgencyPage title={t('ag.ev.title')} description={t('ag.ev.lead')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Filter>
          ariaLabel={t('ag.ev.title')}
          className="w-full max-w-md"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `${t('ag.ev.filterAll')} · ${data?.length ?? 0}` },
            { value: 'overdue', label: `${t('ag.ev.filterOverdue')} · ${data?.filter((r) => r.sla === 'overdue').length ?? 0}` },
            { value: 'demo', label: t('ag.ev.filterDemo') },
          ]}
        />
        {!canAct && <Note tone="muted">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      </div>

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table minWidth={820}>
            <THead>
              <Th>{t('ag.col.case')}</Th>
              <Th>{t('ag.col.subject')}</Th>
              <Th>{t('log.company')}</Th>
              <Th>{t('ag.col.reason')}</Th>
              <Th>{t('ag.col.ai')}</Th>
              <Th>{t('ag.col.age')}</Th>
              <Th>{t('ag.col.sla')}</Th>
            </THead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id} active={r.id === openId} onClick={() => setOpen(r.id)}>
                  <Td className="tabular text-ink-2">{r.id}</Td>
                  <Td className="whitespace-nowrap">
                    {r.studentCode}
                    {r.studentId && (
                      <Chip tone="info" size="sm" className="ml-2" icon={<UserRound size={11} strokeWidth={1.5} />}>
                        demo
                      </Chip>
                    )}
                  </Td>
                  <Td>{r.entry.company}</Td>
                  <Td className="max-w-[260px]">{lt(r.reason)}</Td>
                  <Td className="whitespace-nowrap tabular">
                    {t('ag.ai.escalate')} · {(r.entry.check?.confidence ?? 0).toFixed(2)}
                  </Td>
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
        onClose={() => setOpen(null)}
        width={760}
        title={open ? t('ag.panel.title', { id: open.id }) : ''}
        subtitle={open && `${open.studentCode} · ${open.institution}`}
        closeLabel={t('ag.panel.close')}
        footer={
          open && canAct ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="tertiary" size="sm" icon={<Flag size={14} strokeWidth={1.5} />} onClick={() => setPending('flag')}>
                {t('ag.ev.flag')}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPending('reject')}>
                  {t('ag.ev.reject')}
                </Button>
                <Button size="sm" onClick={() => decide('verify')}>
                  {t('ag.ev.verify')}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <SlaChip sla={open.sla} />
              <Chip tone="muted" size="sm">
                {t('ag.ageLong', { count: open.age })}
              </Chip>
              {open.studentId && <Chip tone="info" size="sm">{t('ag.ev.demoStudent')}</Chip>}
            </div>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <img src={open.preview} alt={t('skillSheet.evidence')} className="max-h-[420px] w-full rounded-card border border-hairline bg-surface-muted object-contain" />
              <div className="space-y-5">
                <section>
                  <SectionLabel className="mb-2">{t('ag.ev.studentEntry')}</SectionLabel>
                  <p className="t-body-strong">{open.entry.role}</p>
                  <p className="text-ink-2">{open.entry.company}</p>
                  <p className="text-ink-2">{t('ag.ev.applied', { date: formatDate(open.entry.appliedAt, lang, 'long'), portal: open.entry.portalName })}</p>
                </section>
                {open.entry.check && <CheckDetails result={open.entry.check} officer />}
              </div>
            </div>
            <p className="t-caption font-normal text-ink-3">{t('ag.ev.flagHint')}</p>
          </div>
        )}
      </SidePanel>

      <ReasonDialog
        open={pending === 'reject' || pending === 'flag'}
        title={pending === 'flag' ? t('ag.ev.flag') : t('ag.ev.reject')}
        confirmLabel={t('ag.confirm')}
        presets={pending === 'flag' ? ['Same image used by another student', 'Image appears edited'] : ['Unreadable, please re-upload the original email', 'Company could not be verified', 'Date outside the application period']}
        onCancel={() => setPending(null)}
        onConfirm={(r) => decide(pending!, r)}
      />
    </AgencyPage>
  )
}
