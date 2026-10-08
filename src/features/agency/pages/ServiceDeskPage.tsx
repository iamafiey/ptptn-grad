import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowUpRight, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate, formatRM } from '@/lib/format'
import { aiAssist, listCases, offerWayBack, replyToCase, resolveCase, type Borrower, type DeskCase, type Resolution } from '@/services/collections'
import { useDemo } from '@/state/DemoProvider'
import { RiskChip } from '../collections/parts'
import { seesAmounts } from '../collections/access'
import { AgencyPage } from '../shell/AgencyPage'
import { REPAY_TONE } from '../tones'
import { useOfficer } from '../useOfficer'

type Filter = 'open' | 'resolved'
type Row = DeskCase & { borrower: Borrower }
const RESOLUTIONS: Resolution[] = ['resolved', 'wayBackOffered', 'promiseToPay', 'escalated', 'wrongContact']

/** Service desk: callbacks, borrower messages and plan call tasks, with an AI assist the agent edits before sending. */
export default function ServiceDeskPage() {
  const { t, lang } = useT()
  const { settings } = useDemo()
  const [params, setParams] = useSearchParams()
  const { data } = useAsync(() => listCases(settings), [settings])
  const [filter, setFilter] = useState<Filter>('open')
  const rows = (data ?? []).filter((c) => c.status === filter)
  const selectedId = params.get('case')
  const selected = (data ?? []).find((c) => c.id === selectedId) ?? (selectedId ? undefined : rows[0])

  return (
    <AgencyPage title={t('agency.nav.serviceDesk')} description={t('col.sd.lead')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <SegmentedControl<Filter>
            ariaLabel={t('agency.nav.serviceDesk')}
            className="w-full"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: t('col.case.openN', { n: (data ?? []).filter((c) => c.status === 'open').length }) },
              { value: 'resolved', label: t('col.case.resolved') },
            ]}
          />
          {rows.length === 0 ? (
            <Card>
              <EmptyState title={t('col.sd.empty')} />
            </Card>
          ) : (
            <Card padded={false} className="divide-y divide-hairline overflow-hidden">
              {rows.map((c) => (
                <button key={c.id} onClick={() => setParams({ case: c.id }, { replace: true })} className={cn('block w-full px-4 py-3 text-left hover:bg-surface-muted', selected?.id === c.id && 'bg-surface-muted')} aria-current={selected?.id === c.id || undefined}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="t-body-strong tabular">{c.borrower.code}</span>
                    <span className="t-caption text-ink-3">{formatDate(c.openedAt, lang)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <Chip tone={c.topic === 'callback' || c.topic === 'planCall' ? 'info' : 'muted'} size="sm" icon={c.topic === 'callback' || c.topic === 'planCall' ? <Phone size={11} strokeWidth={1.5} /> : undefined}>
                      {t(`col.topic.${c.topic}`)}
                    </Chip>
                    <span className="truncate t-caption text-ink-2">{c.slot ?? c.messages.at(-1)?.body ?? t(`col.seg.${c.borrower.segment}`)}</span>
                  </span>
                </button>
              ))}
            </Card>
          )}
        </div>
        <div className="min-w-0">{selected ? <CaseWorkspace key={selected.id} c={selected} /> : <Card><EmptyState title={t('col.sd.pick')} /></Card>}</div>
      </div>
    </AgencyPage>
  )
}

function CaseWorkspace({ c }: { c: Row }) {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const b = c.borrower
  const ai = aiAssist(c, b, settings)
  const [reply, setReply] = useState('')
  const [resolution, setResolution] = useState<Resolution>(c.topic === 'planCall' ? 'promiseToPay' : 'resolved')
  const [note, setNote] = useState('')
  const canAct = !readOnly && c.status === 'open'
  const amounts = seesAmounts(role, settings)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-heading">
              <span className="tabular">{c.id}</span> · {t(`col.topic.${c.topic}`)}
            </p>
            <p className="mt-0.5 t-caption text-ink-2">
              {t('col.sd.opened', { date: formatDate(c.openedAt, lang, 'long') })}
              {c.slot && ` · ${t('col.sd.slot', { slot: c.slot })}`}
            </p>
          </div>
          <Link to={`/a/collections/borrowers/${b.id}`} className="inline-flex items-center gap-1 t-caption text-ink-2 hover:text-ink">
            {t('col.col.borrower')} {b.code} <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <RiskChip b={b} />
          <Chip tone={REPAY_TONE[b.status]} size="sm">
            {t(`rep.status.${b.status}`)}
          </Chip>
          <Chip tone="outline" size="sm">
            {t(`col.seg.${b.segment}`)}
          </Chip>
          {amounts && b.dpd > 0 && (
            <Chip tone="muted" size="sm">
              <span className="tabular">{t('col.sd.due', { amount: formatRM(b.amountDueRM), days: b.dpd })}</span>
            </Chip>
          )}
        </div>
      </Card>

      <Card>
        <SectionLabel
          className="mb-3"
          action={
            <Chip tone="info" size="sm" icon={<Sparkles size={11} strokeWidth={1.5} />}>
              {ai.model}
            </Chip>
          }
        >
          {t('col.sd.assist')}
        </SectionLabel>
        <p className="t-body-sm">{lt(ai.summary)}</p>
        <p className="mt-2 t-body-sm">
          <span className="text-ink-2">{t('col.sd.nextStep')}: </span>
          {lt(ai.nextStep)}
        </p>
        {canAct && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ai.drafts.map((d, i) => (
              <Button key={i} variant="secondary" size="sm" onClick={() => setReply(lt(d))}>
                {t('col.sd.useDraft', { n: i + 1 })}
              </Button>
            ))}
            {b.status !== 'goodStanding' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await offerWayBack(officer, b, ai.offer)
                  toast(t('col.act.offerSent'))
                }}
              >
                {t('col.sd.sendOffer', { kind: t(`rep.way.${ai.offer}`) })}
              </Button>
            )}
          </div>
        )}
        <p className="mt-3 t-caption font-normal text-ink-3">{t('col.sd.assistNote')}</p>
      </Card>

      <Card>
        <SectionLabel className="mb-3">{t('col.sd.conversation')}</SectionLabel>
        {c.messages.length === 0 ? (
          <p className="t-body-sm text-ink-2">{c.virtual ? t('col.sd.planTask') : t('col.sd.noMessages')}</p>
        ) : (
          <ol className="space-y-2">
            {c.messages.map((m, i) => (
              <li key={i} className={cn('max-w-[85%] rounded-card px-3 py-2 t-body-sm', m.from === 'agent' ? 'ml-auto bg-ink text-on-ink' : 'bg-surface-muted')}>
                {m.body}
                <span className={cn('mt-1 block t-micro', m.from === 'agent' ? 'text-on-ink/70' : 'text-ink-3')}>{formatDate(m.at, lang, 'long')}</span>
              </li>
            ))}
          </ol>
        )}
        {canAct && (
          <form
            className="mt-4 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!reply.trim()) return
              await replyToCase(officer, c, b, reply.trim())
              setReply('')
              toast(t('col.sd.replied'))
            }}
          >
            <Textarea label={t('col.sd.reply')} rows={4} value={reply} onChange={(e) => setReply(e.target.value)} />
            <Button type="submit" variant="secondary" size="sm" disabled={!reply.trim()}>
              {t('col.sd.sendReply')}
            </Button>
          </form>
        )}
      </Card>

      {canAct ? (
        <Card>
          <SectionLabel className="mb-3">{t('col.sd.resolve')}</SectionLabel>
          <div className="space-y-2">
            <Select size="sm" label={t('col.sd.outcome')} value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} options={RESOLUTIONS.map((r) => ({ value: r, label: t(`col.res.${r}`) }))} />
            <Textarea label={t('col.sd.resolveNote')} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              size="sm"
              onClick={async () => {
                await resolveCase(officer, c, b, resolution, note.trim())
                toast(t('col.sd.resolved'))
              }}
            >
              {t('col.sd.resolveCase')}
            </Button>
          </div>
        </Card>
      ) : (
        c.resolution && <Note tone="done">{t('col.sd.resolvedAs', { outcome: t(`col.res.${c.resolution}`) })}</Note>
      )}
    </div>
  )
}
