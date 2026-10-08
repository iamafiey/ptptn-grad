import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Briefcase, CalendarCheck, Check, Clock, CreditCard, ExternalLink, FileSignature, Inbox, MessageSquare, Minus, PauseCircle, Phone, RefreshCw, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, SunriseCard } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile } from '@/components/ui/Tiles'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { Rich } from '@/i18n/Rich'
import { formatDate, formatRM } from '@/lib/format'
import { acceptOffer, getSupport, messagePtptn, promiseToPay, requestCallback } from '@/services/collections'
import { getRepayment, requestWayBack, simulateSyncConfirmed, type WayBack } from '@/services/repayment'
import { useDemo } from '@/state/DemoProvider'
import type { BenefitId } from '@/types/domain'
import { StudentPage } from '../shell/StudentPage'
import { useStudent } from '../useStudent'

const BENEFITS: BenefitId[] = ['openJobs', 'partnerRoles', 'courses', 'profileBoost', 'coaching']
const WAYS: { id: WayBack; icon: React.ReactNode }[] = [
  { id: 'payMissed', icon: <CreditCard size={20} strokeWidth={1.5} /> },
  { id: 'salaryDeduction', icon: <Briefcase size={20} strokeWidth={1.5} /> },
  { id: 'restructure', icon: <FileSignature size={20} strokeWidth={1.5} /> },
]
const SLOTS = ['tomorrowAm', 'tomorrowPm', 'fridayAm'] as const
const PROMISE_DATES = ['2026-10-15', '2026-10-22', '2026-10-31']
type SupportSheet = 'callback' | 'message' | 'promise'

/** Repayment standing: benefits earned plus a clear way back. Student-only; never shown to employers. */
export default function RepaymentPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { settings } = useDemo()
  const { id } = useStudent()
  const { data } = useAsync(() => getRepayment(id, settings), [id, settings])
  const { data: support } = useAsync(() => getSupport(id), [id])
  const toast = useToast()
  const [sheet, setSheet] = useState<WayBack | 'handoff' | SupportSheet | null>(null)
  const [busy, setBusy] = useState(false)
  const [slot, setSlot] = useState<(typeof SLOTS)[number]>('tomorrowAm')
  const [promiseDate, setPromiseDate] = useState(PROMISE_DATES[0])
  const [text, setText] = useState('')

  if (!data) return <StudentPage title={t('student.repayment.title')}>{null}</StudentPage>
  const { account: a, tier } = data
  const behind = a.status === 'behind' && tier.tier === 'B'
  const missed = a.payments.filter((p) => p.status === 'missed').length
  const statusTone = a.status === 'grace' ? 'info' : behind ? 'attention' : 'done'

  const offers = support?.offers ?? []
  const cases = support?.cases ?? []
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true)
    await fn()
    setBusy(false)
    setSheet(null)
    setText('')
    toast(done)
  }

  const submitWay = async (kind: WayBack) => {
    setBusy(true)
    await requestWayBack(id, kind)
    setBusy(false)
    setSheet(null)
  }

  return (
    <StudentPage title={t('student.repayment.title')}>
      {/* Tier A celebration: the one Sunrise surface on this screen */}
      {data.justRestored && (
        <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <SunriseCard>
            <Chip tone="ink" icon={<Sparkles size={14} strokeWidth={1.5} />}>
              {t('rep.status.goodStanding')}
            </Chip>
            <h2 className="mt-5 t-display-l">
              <Rich text={t('rep.celebrate')} />
            </h2>
            <p className="mt-2 t-body text-ink-2">{t('rep.celebrateBody')}</p>
            <Button className="mt-5" onClick={() => navigate('/s/opportunities?tab=partner')}>
              {t('rep.celebrateAction')}
            </Button>
          </SunriseCard>
        </motion.div>
      )}

      {/* Status */}
      <Card>
        <Chip tone={statusTone}>{t(`rep.status.${a.status}`)}</Chip>
        <p className="mt-2 t-body">{a.status === 'behind' ? t('rep.meaning.behind', { count: missed || a.missedCount }) : t(`rep.meaning.${a.status}`)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-control bg-surface-muted p-3">
            <dt className="t-caption text-ink-2">{a.status === 'grace' ? t('rep.graceEnds') : t('rep.nextPayment')}</dt>
            <dd className="t-body-strong tabular">{formatDate(a.status === 'grace' ? (a.graceEndsAt ?? '') : (a.nextPayment?.dueAt ?? ''), lang, 'long')}</dd>
            {a.status !== 'grace' && a.nextPayment && <dd className="t-caption tabular text-ink-2">{formatRM(a.nextPayment.amountRM)}</dd>}
          </div>
          <div className="rounded-control bg-surface-muted p-3">
            <dt className="t-caption text-ink-2">{t('rep.benefits')}</dt>
            <dd className="t-body-strong tabular">{t('home.standing.benefits', { unlocked: tier.benefits.filter((b) => b.state !== 'paused').length, total: tier.benefits.length })}</dd>
            {a.method && <dd className="t-caption text-ink-2">{t(`rep.method.${a.method}`)}</dd>}
          </div>
        </dl>
        {a.status !== 'grace' && !data.justRestored && (
          <Button block className="mt-4" icon={<Wallet size={18} strokeWidth={1.5} />} onClick={() => setSheet('handoff')}>
            {t('rep.payNow')}
          </Button>
        )}
      </Card>

      {/* Ways back */}
      {/* Offers from a PTPTN officer: accepting submits the same way back as self-service */}
      {offers.length > 0 && !data.pendingWayBack && (
        <section className="space-y-3">
          <SectionLabel>{t('rep.offer.label')}</SectionLabel>
          {offers.map((o) => (
            <Card key={o.id} as="article">
              <div className="flex items-start gap-3">
                <IconTile className="bg-info text-info-ink">
                  <Inbox size={20} strokeWidth={1.5} />
                </IconTile>
                <div className="min-w-0">
                  <p className="t-body-strong">{t(`rep.way.${o.kind}`)}</p>
                  <p className="t-caption font-normal text-ink-2">{t(`rep.way.${o.kind}Body`)}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSheet('message')}>
                  {t('rep.offer.ask')}
                </Button>
                <Button variant="secondary" size="sm" loading={busy} className="border-ink" onClick={() => run(() => acceptOffer(id, o.id), t('rep.offer.accepted'))}>
                  {t('rep.offer.accept')}
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {(behind || data.pendingWayBack) && (
        <section className="space-y-3">
          <SectionLabel>{t('rep.waysBack')}</SectionLabel>
          {data.pendingWayBack ? (
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <IconTile className="bg-pending text-pending-ink">
                  <Clock size={20} strokeWidth={1.5} />
                </IconTile>
                <div>
                  <p className="t-body-strong">{t('rep.way.pending')}</p>
                  <p className="t-caption font-normal text-ink-2">{t(`rep.way.${data.pendingWayBack}`)}</p>
                </div>
              </div>
              <p className="t-body text-ink-2">{t('rep.way.pendingBody')}</p>
              <Button
                variant="secondary"
                block
                loading={busy}
                icon={<RefreshCw size={16} strokeWidth={1.5} />}
                className="border-dashed"
                onClick={async () => {
                  setBusy(true)
                  await simulateSyncConfirmed(id)
                  setBusy(false)
                  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
                }}
              >
                {t('rep.way.simulate')}
              </Button>
            </Card>
          ) : (
            WAYS.map((w) => (
              <Card key={w.id} as="article">
                <button onClick={() => setSheet(w.id)} className="flex w-full items-center gap-3 text-left">
                  <IconTile>{w.icon}</IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-strong">{t(`rep.way.${w.id}`)}</span>
                    <span className="block t-caption font-normal text-ink-2">{w.id === 'payMissed' ? t('rep.way.payMissedBody', { amount: formatRM(data.missedAmountRM) }) : t(`rep.way.${w.id}Body`)}</span>
                  </span>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
                </button>
              </Card>
            ))
          )}
          {behind && !data.pendingWayBack &&
            (support?.promise ? (
              <Note tone="info" icon={<CalendarCheck size={14} strokeWidth={1.5} />}>
                {t('rep.promise.set', { date: formatDate(support.promise.date, lang, 'long') })}
              </Note>
            ) : (
              <Card as="article">
                <button onClick={() => setSheet('promise')} className="flex w-full items-center gap-3 text-left">
                  <IconTile>
                    <CalendarCheck size={20} strokeWidth={1.5} />
                  </IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-strong">{t('rep.promise.title')}</span>
                    <span className="block t-caption font-normal text-ink-2">{t('rep.promise.body')}</span>
                  </span>
                  <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
                </button>
              </Card>
            ))}
        </section>
      )}

      {/* Benefits */}
      <section className="space-y-3">
        <SectionLabel>{t('rep.benefits')}</SectionLabel>
        <Card padded={false} className="divide-y divide-hairline">
          {BENEFITS.map((b) => {
            const state = tier.benefits.find((x) => x.id === b)?.state ?? 'unlocked'
            return (
              <div key={b} className="flex items-center gap-3 px-4 py-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-control ${state === 'unlocked' ? 'bg-done text-done-ink' : state === 'preview' ? 'bg-info text-info-ink' : 'bg-attention text-attention-ink'}`}>
                  {state === 'unlocked' ? <Check size={16} strokeWidth={2} /> : state === 'preview' ? <Minus size={16} strokeWidth={2} /> : <PauseCircle size={16} strokeWidth={1.5} />}
                </span>
                <span className="flex-1 t-body">{t(`rep.benefit.${b}`)}</span>
                <span className="t-caption text-ink-2">{t(`rep.benefit.state.${state}`)}</span>
              </div>
            )
          })}
        </Card>
      </section>

      {/* Job search counts too */}
      {settings.jobSeeking.supportsDeferment && (
        <Card>
          <SectionLabel>{t('rep.jobSearch')}</SectionLabel>
          <p className="mt-2 t-body">{t('rep.jobSearchBody', { verified: data.jobSearch.verified, threshold: data.jobSearch.threshold })}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-hairline">
            <div className="h-full bg-ink" style={{ width: `${Math.min(100, (data.jobSearch.verified / data.jobSearch.threshold) * 100)}%` }} />
          </div>
          <Button variant="tertiary" size="sm" className="mt-2" onClick={() => navigate('/s/opportunities?tab=log')}>
            {t('opp.tab.log')}
          </Button>
        </Card>
      )}

      {/* Talk to us: callback or message; open requests show their status */}
      <section className="space-y-3">
        <SectionLabel>{t('rep.talk.label')}</SectionLabel>
        {cases.map((c) => {
          const reply = [...c.messages].reverse().find((m) => m.from === 'agent')
          return (
            <Card key={c.id} as="article">
              <div className="flex items-start justify-between gap-3">
                <p className="t-body-strong">{c.topic === 'callback' ? t('rep.talk.callbackOpen') : t('rep.talk.messageOpen')}</p>
                <Chip tone="pending" size="sm">
                  {t('rep.talk.open')}
                </Chip>
              </div>
              <p className="mt-1 t-caption font-normal text-ink-2">{c.slot ? t('rep.talk.slot', { slot: c.slot }) : t('rep.talk.replyBy')}</p>
              {reply && <p className="mt-3 rounded-control bg-surface-muted p-3 t-body-sm">{t('rep.talk.reply', { body: reply.body })}</p>}
            </Card>
          )
        })}
        <Card padded={false} className="divide-y divide-hairline">
          {(
            [
              ['callback', <Phone key="p" size={20} strokeWidth={1.5} />],
              ['message', <MessageSquare key="m" size={20} strokeWidth={1.5} />],
            ] as const
          ).map(([k, icon]) => (
            <button key={k} onClick={() => setSheet(k)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <IconTile>{icon}</IconTile>
              <span className="min-w-0 flex-1">
                <span className="block t-body-strong">{t(`rep.talk.${k}`)}</span>
                <span className="block t-caption font-normal text-ink-2">{t(`rep.talk.${k}Body`)}</span>
              </span>
              <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
            </button>
          ))}
        </Card>
      </section>

      {/* Payments */}
      <section className="space-y-3">
        <SectionLabel>{t('rep.payments')}</SectionLabel>
        {a.payments.length === 0 ? (
          <Note tone="muted">{t('rep.noPayments')}</Note>
        ) : (
          <Card padded={false} className="divide-y divide-hairline">
            {[...a.payments].reverse().map((p) => (
              <div key={p.at} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="t-body tabular">{formatDate(p.at, lang, 'long')}</span>
                <span className="flex items-center gap-2">
                  <span className="t-body tabular">{formatRM(p.amountRM)}</span>
                  <Chip tone={p.status === 'paid' ? 'done' : 'attention'} size="sm">
                    {t(p.status === 'paid' ? 'rep.paid' : 'rep.missed')}
                  </Chip>
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Pay now: hand-off to the official channel */}
      <Sheet
        open={sheet === 'handoff'}
        onClose={() => setSheet(null)}
        title={t('rep.handoffTitle')}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            loading={busy}
            icon={<ExternalLink size={16} strokeWidth={1.5} />}
            onClick={async () => {
              if (behind) await submitWay('payMissed')
              else setSheet(null)
            }}
          >
            {t('rep.handoffContinue')}
          </Button>
        }
      >
        <p className="t-body text-ink-2">{t('rep.handoffBody')}</p>
        {a.nextPayment && <p className="mt-4 t-heading tabular">{formatRM(behind ? data.missedAmountRM : a.nextPayment.amountRM)}</p>}
      </Sheet>

      {/* Ways back sheets */}
      {WAYS.map((w) => (
        <Sheet
          key={w.id}
          open={sheet === w.id}
          onClose={() => setSheet(null)}
          title={t(`rep.way.${w.id}`)}
          closeLabel={t('action.close')}
          footer={
            <Button block loading={busy} onClick={() => submitWay(w.id)}>
              {t('rep.way.submit')}
            </Button>
          }
        >
          {w.id === 'payMissed' && (
            <>
              <p className="t-body text-ink-2">{t('rep.handoffBody')}</p>
              <p className="mt-4 t-heading tabular">{formatRM(data.missedAmountRM)}</p>
            </>
          )}
          {w.id === 'salaryDeduction' && <p className="t-body text-ink-2">{t('rep.salaryBody')}</p>}
          {w.id === 'restructure' && (
            <>
              <p className="t-body text-ink-2">{t('rep.restructureBody')}</p>
              <Note tone={data.jobSearch.met ? 'done' : 'muted'} className="mt-4">
                {t('rep.jobSearchBody', { verified: data.jobSearch.verified, threshold: data.jobSearch.threshold })}
              </Note>
            </>
          )}
        </Sheet>
      ))}
      <Sheet
        open={sheet === 'callback'}
        onClose={() => setSheet(null)}
        title={t('rep.talk.callback')}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={busy} onClick={() => run(() => requestCallback(id, t(`rep.slot.${slot}`), text.trim()), t('rep.talk.callbackDone'))}>
            {t('rep.talk.callbackSubmit')}
          </Button>
        }
      >
        <p className="t-body text-ink-2">{t('rep.talk.callbackHint')}</p>
        <div className="mt-4">
          <ChipSelect label={t('rep.talk.when')} value={[slot]} onChange={(v) => setSlot(v[0] ?? slot)} options={SLOTS.map((x) => ({ value: x, label: t(`rep.slot.${x}`) }))} />
        </div>
        <Textarea className="mt-4" label={t('rep.talk.about')} value={text} onChange={(e) => setText(e.target.value)} />
      </Sheet>

      <Sheet
        open={sheet === 'message'}
        onClose={() => setSheet(null)}
        title={t('rep.talk.message')}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={busy} disabled={text.trim().length < 3} onClick={() => run(() => messagePtptn(id, text.trim()), t('rep.talk.messageDone'))}>
            {t('rep.talk.send')}
          </Button>
        }
      >
        <p className="t-body text-ink-2">{t('rep.talk.messageHint')}</p>
        <Textarea className="mt-4" rows={4} label={t('rep.talk.yourMessage')} value={text} onChange={(e) => setText(e.target.value)} />
      </Sheet>

      <Sheet
        open={sheet === 'promise'}
        onClose={() => setSheet(null)}
        title={t('rep.promise.title')}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={busy} onClick={() => run(() => promiseToPay(id, promiseDate), t('rep.promise.done'))}>
            {t('rep.promise.submit')}
          </Button>
        }
      >
        <p className="t-body text-ink-2">{t('rep.promise.hint', { amount: formatRM(data.missedAmountRM) })}</p>
        <div className="mt-4">
          <ChipSelect label={t('rep.promise.by')} value={[promiseDate]} onChange={(v) => setPromiseDate(v[0] ?? promiseDate)} options={PROMISE_DATES.map((d) => ({ value: d, label: formatDate(d, lang, 'long') }))} />
        </div>
      </Sheet>
    </StudentPage>
  )
}
