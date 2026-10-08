import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Eye, Flag, PauseCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import type { ContactChannel } from '@/config/programmeSettings'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate, formatRM } from '@/lib/format'
import { logAudit } from '@/services/audit'
import {
  addBorrowerNote,
  flagScore,
  getBorrower,
  logCall,
  offerWayBack,
  revealBorrower,
  sendTemplate,
  signalText,
  templateList,
  togglePlan,
  type Borrower,
  type CallOutcome,
  type TemplateId,
} from '@/services/collections'
import { getOfficerById } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'
import { canAccess } from '../nav'
import { PaymentStrip, RiskChip } from '../collections/parts'
import { seesAmounts } from '../collections/access'
import { AgencyPage } from '../shell/AgencyPage'
import { REPAY_TONE } from '../tones'
import { useOfficer } from '../useOfficer'

type Pending = 'reveal' | 'flag' | 'plan' | null
const OUTCOMES: CallOutcome[] = ['reached', 'noAnswer', 'wrongNumber', 'promise']
const OFFERS = ['salaryDeduction', 'restructure', 'deferment'] as const
const opened = new Set<string>()

/** Borrower record: payment history, the explained early-warning score, the plan, and supportive actions. */
export default function BorrowerRecordPage() {
  const { borrowerId = '' } = useParams()
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const { data, loading } = useAsync(() => getBorrower(borrowerId, settings), [borrowerId, settings])
  const [revealed, setRevealed] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const canAct = !readOnly && (role === 'collectionLiaison' || role === 'customerServiceAgent' || role === 'superAdmin')
  const canPlan = !readOnly && (role === 'collectionLiaison' || role === 'superAdmin')

  useEffect(() => {
    const key = `${officer.id}:${borrowerId}`
    if (!data?.borrower || opened.has(key)) return
    opened.add(key)
    logAudit(officer, 'Opened borrower record', 'borrower', data.borrower.code)
  }, [data?.borrower, officer, borrowerId])

  if (!data)
    return (
      <AgencyPage title={t('agency.nav.borrowers')}>
        <Card>{!loading && <EmptyState title={t('ag.empty')} />}</Card>
      </AgencyPage>
    )

  const { borrower: b, timeline, cases, offers } = data
  const amounts = seesAmounts(role, settings)
  const paused = b.plan?.state === 'paused'

  return (
    <AgencyPage
      title={`${t('col.col.borrower')} ${b.code}`}
      description={`${b.institution} · ${t('col.rec.cohort', { year: b.cohort })} · ${b.state}`}
      actions={
        !revealed &&
        canAct && (
          <Button variant="secondary" size="sm" icon={<Eye size={14} strokeWidth={1.5} />} onClick={() => setPending('reveal')}>
            {t('st.reveal')}
          </Button>
        )
      }
    >
      <Link to="/a/collections/borrowers" className="mb-4 inline-flex items-center gap-1.5 t-caption text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.5} /> {t('agency.nav.borrowers')}
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {revealed ? (
          <Chip tone="ink">
            {b.name} · {b.icMasked}
          </Chip>
        ) : (
          <Chip tone="muted">{t('st.masked')}</Chip>
        )}
        <RiskChip b={b} />
        <Chip tone={REPAY_TONE[b.status]}>{t(`rep.status.${b.status}`)}</Chip>
        <Chip tone="outline">{t(`col.seg.${b.segment}`)}</Chip>
        {b.promise && <Chip tone="info">{t('col.rec.promiseChip', { date: formatDate(b.promise.date, lang) })}</Chip>}
        {b.demo && canAccess(`/a/students/${b.id}`, role) && (
          <Link to={`/a/students/${b.id}`} className="inline-flex items-center gap-1 t-caption text-ink-2 hover:text-ink">
            {t('col.rec.studentRecord')} <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-4">
          <Card>
            <SectionLabel className="mb-3">{t('col.rec.history')}</SectionLabel>
            <PaymentStrip history={b.history} />
            {amounts ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Fact label={t('col.rec.instalment')} value={b.instalmentRM ? formatRM(b.instalmentRM) : '—'} />
                <Fact label={t('col.col.due')} value={b.amountDueRM ? formatRM(b.amountDueRM) : '—'} />
                <Fact label={t('col.col.dpd')} value={b.dpd ? String(b.dpd) : '—'} />
                <Fact label={t('col.rec.lastPayment')} value={b.lastPaymentAt ? formatDate(b.lastPaymentAt, lang) : '—'} />
                <Fact label={b.status === 'grace' ? t('rep.graceEnds') : t('col.rec.nextDue')} value={b.nextDueAt ? formatDate(b.nextDueAt, lang) : '—'} />
                <Fact label={t('col.rec.method')} value={b.method ? t(`rep.method.${b.method}`) : t('rep.method.manual')} />
              </dl>
            ) : (
              <Note tone="muted" className="mt-4">
                {t('col.rec.amountsHidden')}
              </Note>
            )}
          </Card>

          <Card>
            <SectionLabel
              className="mb-3"
              action={
                canAct &&
                !b.flagged && (
                  <button onClick={() => setPending('flag')} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 t-caption text-ink-2 hover:bg-surface-muted hover:text-ink">
                    <Flag size={14} strokeWidth={1.5} /> {t('col.rec.flag')}
                  </button>
                )
              }
            >
              {t('col.rec.earlyWarning')}
            </SectionLabel>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="t-heading">{t(`col.risk.${b.risk.level}`)}</p>
              <p className="t-caption text-ink-2">{t('col.rec.scoreLine', { score: b.risk.score, confidence: Math.round(b.risk.confidence * 100), model: b.risk.modelVersion })}</p>
            </div>
            <SignalList title={t('col.rec.raising')} signals={b.risk.reasons} sign="+" />
            {b.risk.mitigating.length > 0 && <SignalList title={t('col.rec.lowering')} signals={b.risk.mitigating} sign="" />}
            {b.flagged && (
              <Note tone="pending" className="mt-4">
                {t('col.rec.flagged')}
              </Note>
            )}
            <Note tone="muted" className="mt-4">
              {t('col.rec.scoreRule')}
            </Note>
          </Card>

          <Card>
            <SectionLabel className="mb-3">{t('st.timeline')}</SectionLabel>
            {timeline.length === 0 ? (
              <p className="t-body-sm text-ink-2">{t('ag.empty')}</p>
            ) : (
              <ol className="space-y-3 border-l border-hairline pl-4">
                {timeline.slice(0, 14).map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <p className="t-body-sm">{typeof e.text === 'string' ? e.text : lt(e.text)}</p>
                    <p className="t-caption font-normal text-ink-3">
                      {formatDate(e.at, lang, 'long')} · {t(`col.tl.${e.kind}`)}
                      {e.by && ` · ${e.by === 'student' ? t('col.tl.byStudent') : (getOfficerById(e.by)?.name ?? e.by)}`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <PlanCard b={b} canPlan={canPlan} onToggle={() => setPending('plan')} />
          {canAct && <ActionsCard b={b} />}
          <Card>
            <SectionLabel className="mb-3">{t('col.rec.contact')}</SectionLabel>
            <dl className="space-y-2 t-body-sm">
              <Row label={t('col.rec.reachable')} value={b.reachable ? t('st.yes') : t('st.no')} />
              <Row label={t('col.rec.unanswered')} value={String(b.unanswered)} />
              <Row label={t('col.rec.thisWeek')} value={t('col.rec.ofCap', { n: b.contactsThisWeek, cap: settings.collections.contactCapPerWeek })} />
              <Row label={t('col.rec.lastActive')} value={formatDate(b.lastActive, lang)} />
              <Row label={t('col.rec.partnerInterest')} value={String(b.partnerInterest)} />
            </dl>
          </Card>
          {(cases.length > 0 || offers.length > 0) && (
            <Card>
              <SectionLabel className="mb-3">{t('col.rec.cases')}</SectionLabel>
              <ul className="space-y-2">
                {offers.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 t-body-sm">
                    <span>{t('col.rec.offer', { kind: t(`rep.way.${o.kind}`) })}</span>
                    <Chip tone={o.status === 'accepted' ? 'done' : 'pending'} size="sm">
                      {t(`col.offer.${o.status}`)}
                    </Chip>
                  </li>
                ))}
                {cases.map((c) => (
                  <li key={c.id}>
                    <Link to={`/a/collections/service?case=${c.id}`} className="flex items-center justify-between gap-3 t-body-sm hover:text-ink-2">
                      <span className="min-w-0 truncate">
                        <span className="tabular">{c.id}</span> · {t(`col.topic.${c.topic}`)}
                      </span>
                      <Chip tone={c.status === 'open' ? 'pending' : 'done'} size="sm">
                        {t(`col.case.${c.status}`)}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <ReasonDialog
        open={pending === 'reveal'}
        title={t('st.reveal')}
        confirmLabel={t('st.reveal')}
        presets={[t('col.reason.call'), t('col.reason.verify')]}
        onCancel={() => setPending(null)}
        onConfirm={(r) => {
          revealBorrower(officer, b, r)
          setRevealed(true)
          setPending(null)
        }}
      />
      <ReasonDialog
        open={pending === 'flag'}
        title={t('col.rec.flag')}
        confirmLabel={t('col.rec.flagConfirm')}
        presets={[t('col.reason.paidElsewhere'), t('col.reason.hardship'), t('col.reason.dataWrong')]}
        onCancel={() => setPending(null)}
        onConfirm={async (r) => {
          setPending(null)
          await flagScore(officer, b, r)
          toast(t('col.rec.flagDone'))
        }}
      />
      <ReasonDialog
        open={pending === 'plan'}
        title={paused ? t('col.plan.resume') : t('col.plan.pause')}
        confirmLabel={paused ? t('col.plan.resume') : t('col.plan.pause')}
        presets={[t('col.reason.hardship'), t('col.reason.inTalks')]}
        onCancel={() => setPending(null)}
        onConfirm={async (r) => {
          setPending(null)
          await togglePlan(officer, b, r)
          toast(paused ? t('col.plan.resumed') : t('col.plan.paused'))
        }}
      />
    </AgencyPage>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-muted p-3">
      <dt className="t-caption text-ink-2">{label}</dt>
      <dd className="t-body-strong tabular">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  )
}

function SignalList({ title, signals, sign }: { title: string; signals: Borrower['risk']['reasons']; sign: string }) {
  const { lt } = useT()
  return (
    <div className="mt-4">
      <p className="mb-2 t-caption text-ink-2">{title}</p>
      <ul className="space-y-1.5">
        {signals.map((x) => (
          <li key={x.key} className="flex items-start justify-between gap-3 t-body-sm">
            <span>{lt(signalText(x))}</span>
            <span className="shrink-0 tabular text-ink-2">
              {sign}
              {x.weight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlanCard({ b, canPlan, onToggle }: { b: Borrower; canPlan: boolean; onToggle: () => void }) {
  const { t, lt } = useT()
  const p = b.plan
  return (
    <Card>
      <SectionLabel
        className="mb-3"
        action={
          canPlan &&
          p &&
          p.state !== 'completed' && (
            <button onClick={onToggle} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 t-caption text-ink-2 hover:bg-surface-muted hover:text-ink">
              {p.state === 'paused' ? <PlayCircle size={14} strokeWidth={1.5} /> : <PauseCircle size={14} strokeWidth={1.5} />}
              {p.state === 'paused' ? t('col.plan.resume') : t('col.plan.pause')}
            </button>
          )
        }
      >
        {t('col.rec.plan')}
      </SectionLabel>
      {!p ? (
        <p className="t-body-sm text-ink-2">{t('col.rec.noPlan')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="t-body-strong">{t(`col.seg.${b.segment}`)}</p>
            <Chip tone={p.state === 'running' ? 'info' : p.state === 'completed' ? 'done' : 'pending'} size="sm">
              {t(`col.planState.${p.state}`)}
            </Chip>
          </div>
          <p className="mt-1 t-caption font-normal text-ink-2">{t('col.rec.planDay', { day: p.elapsed, version: p.plan.version })}</p>
          <ol className="mt-3 space-y-2">
            {p.plan.steps.map((s, i) => {
              const done = i < p.done.length
              const next = p.next === s
              return (
                <li key={i} className={cn('flex items-start gap-3 t-body-sm', !done && !next && 'text-ink-2')}>
                  <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-circle t-micro tabular', done ? 'bg-done text-done-ink' : next ? 'bg-ink text-on-ink' : 'bg-surface-muted')}>{i + 1}</span>
                  <span className="min-w-0">
                    {t('col.plan.day', { day: s.day })} · {s.kind === 'call' ? t('col.plan.call') : `${lt(templateName(s.templateId))} · ${t(`col.channel.${s.channel ?? "inApp"}`)}`}
                    {next && p.state === 'running' && <span className="block t-caption text-ink-2">{t('col.plan.dueIn', { count: p.dueIn ?? 0 })}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
          {p.state === 'promise' && b.promise && (
            <Note tone="info" className="mt-3">
              {t('col.plan.promisePaused')}
            </Note>
          )}
        </>
      )}
    </Card>
  )
}

const TEMPLATES = templateList()
const templateName = (id?: TemplateId) => TEMPLATES.find((x) => x.id === id)?.name ?? { en: id ?? '' }

function ActionsCard({ b }: { b: Borrower }) {
  const { t, lt } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer } = useOfficer()
  const [template, setTemplate] = useState<TemplateId>(b.status === 'behind' ? (b.employed ? 'salaryDeduction' : 'restructureOffer') : b.employed ? 'setupRepayment' : 'defermentInfo')
  const [channel, setChannel] = useState<ContactChannel>(settings.collections.channels[0] ?? 'inApp')
  const [outcome, setOutcome] = useState<CallOutcome>('reached')
  const [callNote, setCallNote] = useState('')
  const [promiseDate, setPromiseDate] = useState('2026-10-15')
  const [note, setNote] = useState('')
  const atCap = b.contactsThisWeek >= settings.collections.contactCapPerWeek

  return (
    <Card>
      <SectionLabel className="mb-3">{t('st.actions')}</SectionLabel>

      <p className="mb-2 t-caption text-ink-2">{t('col.act.offer')}</p>
      <div className="flex flex-wrap gap-2">
        {OFFERS.map((k) => (
          <Button
            key={k}
            variant="secondary"
            size="sm"
            onClick={async () => {
              await offerWayBack(officer, b, k)
              toast(t('col.act.offerSent'))
            }}
          >
            {t(`rep.way.${k}`)}
          </Button>
        ))}
      </div>

      <form
        className="mt-5 space-y-2 border-t border-hairline pt-4"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await sendTemplate(officer, b, template, channel, settings)
            toast(t('col.act.sent'))
          } catch {
            toast(t('col.act.capReached'))
          }
        }}
      >
        <p className="t-caption text-ink-2">{t('col.act.message')}</p>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Select size="sm" label={t('col.act.template')} hideLabel value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)} options={TEMPLATES.map((x) => ({ value: x.id, label: lt(x.name) }))} />
          <Select size="sm" label={t('col.act.channel')} hideLabel value={channel} onChange={(e) => setChannel(e.target.value as ContactChannel)} options={settings.collections.channels.map((c) => ({ value: c, label: t(`col.channel.${c}`) }))} />
        </div>
        <p className="rounded-control bg-surface-muted p-3 t-caption text-ink-2">{lt(TEMPLATES.find((x) => x.id === template)!.body)}</p>
        {atCap && <Note tone="pending">{t('col.act.capNote', { cap: settings.collections.contactCapPerWeek })}</Note>}
        <Button type="submit" variant="secondary" size="sm" disabled={atCap}>
          {t('col.act.send')}
        </Button>
      </form>

      <form
        className="mt-5 space-y-2 border-t border-hairline pt-4"
        onSubmit={async (e) => {
          e.preventDefault()
          await logCall(officer, b, outcome, callNote.trim(), outcome === 'promise' ? promiseDate : undefined)
          setCallNote('')
          toast(t('col.act.callLogged'))
        }}
      >
        <p className="t-caption text-ink-2">{t('col.act.logCall')}</p>
        <Select size="sm" label={t('col.act.outcome')} hideLabel value={outcome} onChange={(e) => setOutcome(e.target.value as CallOutcome)} options={OUTCOMES.map((o) => ({ value: o, label: t(`col.outcome.${o}`) }))} />
        {outcome === 'promise' && <Field type="date" label={t('col.act.promiseDate')} value={promiseDate} min="2026-10-08" onChange={(e) => setPromiseDate(e.target.value)} />}
        <Textarea label={t('col.act.callNote')} rows={2} value={callNote} onChange={(e) => setCallNote(e.target.value)} />
        <Button type="submit" variant="secondary" size="sm">
          {t('col.act.saveCall')}
        </Button>
      </form>

      <form
        className="mt-5 space-y-2 border-t border-hairline pt-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!note.trim()) return
          await addBorrowerNote(officer, b, note.trim())
          setNote('')
          toast(t('ag.done'))
        }}
      >
        <Textarea label={t('col.act.note')} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" variant="secondary" size="sm" disabled={!note.trim()}>
          {t('st.addNote')}
        </Button>
      </form>
      <p className="mt-4 t-caption font-normal text-ink-3">{t('col.act.rules', { start: settings.collections.quietHours.start, end: settings.collections.quietHours.end, cap: settings.collections.contactCapPerWeek })}</p>
    </Card>
  )
}
