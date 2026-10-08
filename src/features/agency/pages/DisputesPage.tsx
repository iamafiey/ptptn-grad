import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { SidePanel } from '@/components/agency/SidePanel'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { canWorkQueue } from '@/services/agencyQueues'
import { listDisputes, resolveDispute, type DisputeView } from '@/services/disputes'
import { skillById } from '@/services/taxonomy'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

type Outcome = 'upheld' | 'corrected' | 'evidenceRequested'

/** Skill disputes: student comment, AI rationale and evidence side by side → Uphold · Correct · Request evidence. */
export default function DisputesPage() {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const [params, setParams] = useSearchParams()
  const { data } = useAsync(() => listDisputes(), [])
  const [note, setNote] = useState('')
  const [taxonomyIssue, setTaxonomyIssue] = useState(false)
  const canAct = !readOnly && canWorkQueue(role, 'skillDisputes')

  const openId = params.get('case')
  const open: DisputeView | null = data?.find((d) => d.id === openId) ?? null
  const setOpen = (id: string | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('case', id)
    else p.delete('case')
    setParams(p, { replace: true })
    setNote('')
    setTaxonomyIssue(false)
  }
  const skillName = (id: string) => lt(skillById(id)?.name ?? { en: id })

  const decide = async (o: Outcome) => {
    if (!open) return
    await resolveDispute(officer, open, o, note || t(`sd.defaultNote.${o}`), taxonomyIssue)
    setOpen(null)
    toast(t('sd.resolved'))
  }

  return (
    <AgencyPage title={t('agency.nav.disputes')} description={t('sd.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <Card padded={false} className="overflow-hidden">
        {data && data.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table minWidth={820}>
            <THead>
              <Th>{t('ag.col.case')}</Th>
              <Th>{t('ag.col.subject')}</Th>
              <Th>{t('le.gap.skill')}</Th>
              <Th>{t('ag.col.reason')}</Th>
              <Th>{t('sd.current')}</Th>
              <Th>{t('sd.claimed')}</Th>
              <Th>{t('sd.opened')}</Th>
            </THead>
            <tbody>
              {(data ?? []).map((d) => (
                <Tr key={d.id} active={d.id === openId} onClick={() => setOpen(d.id)}>
                  <Td className="tabular text-ink-2">{d.id}</Td>
                  <Td className="whitespace-nowrap">
                    {d.studentCode}
                    {d.studentId && (
                      <Chip tone="info" size="sm" className="ml-2" icon={<UserRound size={11} strokeWidth={1.5} />}>
                        demo
                      </Chip>
                    )}
                  </Td>
                  <Td>{skillName(d.skillId)}</Td>
                  <Td>{t(`sd.reason.${d.reason}`)}</Td>
                  <Td>{t(`skill.level.${d.level}`)}</Td>
                  <Td>{t(`skill.level.${d.claimed}`)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(d.openedAt, lang)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SidePanel
        open={!!open}
        onClose={() => setOpen(null)}
        width={720}
        title={open ? `${open.id} · ${skillName(open.skillId)}` : ''}
        subtitle={open?.studentCode}
        closeLabel={t('ag.panel.close')}
        footer={
          open && canAct ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="tertiary" size="sm" onClick={() => decide('evidenceRequested')}>
                {t('sd.request')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => decide('upheld')}>
                {t('sd.uphold')}
              </Button>
              <Button size="sm" onClick={() => decide('corrected')}>
                {t('sd.correct')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Chip tone="muted" size="sm">
                {t('sd.current')}: {t(`skill.level.${open.level}`)}
              </Chip>
              <Chip tone="pending" size="sm">
                {t('sd.claimed')}: {t(`skill.level.${open.claimed}`)}
              </Chip>
              {open.studentId && <Chip tone="info" size="sm">{t('ag.ev.demoStudent')}</Chip>}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <section className="rounded-control bg-surface-muted p-4">
                <SectionLabel className="mb-2">{t('sd.studentSays')}</SectionLabel>
                <p className="t-body-sm">“{open.comment}”</p>
              </section>
              <section className="rounded-control bg-surface-muted p-4">
                <SectionLabel className="mb-2">{t('sd.aiSays')}</SectionLabel>
                <p className="t-body-sm">{open.aiRationale}</p>
              </section>
              <section className="rounded-control bg-surface-muted p-4">
                <SectionLabel className="mb-2">{t('sd.evidence')}</SectionLabel>
                <ul className="space-y-1 t-body-sm">
                  {open.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>
            </div>
            {canAct && (
              <>
                <Textarea label={t('sd.note')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                <label className="flex items-center gap-2 t-body-sm">
                  <input type="checkbox" checked={taxonomyIssue} onChange={(e) => setTaxonomyIssue(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
                  {t('sd.taxonomy')}
                </label>
              </>
            )}
          </div>
        )}
      </SidePanel>
    </AgencyPage>
  )
}
