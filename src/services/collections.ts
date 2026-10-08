import type { ContactChannel, ProgrammeSettings } from '@/config/programmeSettings'
import { COLLECTIONS_TODAY, DPD_TREND, HISTORY_MONTHS, PLAN_RESULTS, SEGMENT_ORDER, TEMPLATES, BORROWER_SEED, type BorrowerSeed, type CaseTopic, type FollowUpPlan, type PayMark, type PlanStep, type SegmentId, type ServiceCase, type TemplateId } from '@/data/collections'
import { REPAYMENT_SEED } from '@/data/jobLog'
import type { LocalizedText, Officer } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb, type ChangeRequest, type ContactEvent, type WayBackOffer } from './db'
import { delay } from './delay'
import { proposeChange } from './governance'
import { buildSummary, CURRENT_MONTH } from './jobLog'
import { requestWayBack } from './repayment'

// Collections & customer service (docs/collections-flow.md).
// The early-warning score only orders the worklist and triggers supportive messages:
// it never changes a tier, a benefit or a plan by itself. Students never see it.

export type { CaseTopic, FollowUpPlan, PayMark, PlanStep, SegmentId, ServiceCase, TemplateId }
export { HISTORY_MONTHS, SEGMENT_ORDER }

export const EW_MODEL_VERSION = 'earlywarn-0.3 (on-prem)'
/** Borrowers the programme serves; the prototype worklist is a sample of them. */
export const PROGRAMME_BORROWERS = 18420
const DEMO_IDS = ['nurul', 'hafiz', 'kavitha']
const CODES: Record<string, string> = { hafiz: 'S-26013', kavitha: 'S-24087', nurul: 'S-26150' }
const PLAN_START: Record<string, string> = { hafiz: '2026-10-05', kavitha: '2026-10-01' }

const daysBetween = (from: string, to: string) => Math.round((new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime()) / 86_400_000)

// ---------------------------------------------------------------- Borrowers

export type SignalKey =
  | 'graceEndingNoJob'
  | 'jobSearchLow'
  | 'jobSearchLowTwice'
  | 'missedRecent'
  | 'partialRecent'
  | 'dpdOver30'
  | 'inactive60'
  | 'unreachable'
  | 'salaryDeduction'
  | 'employed'
  | 'meetsThreshold'
  | 'openWayBack'
  | 'promise'
export interface Signal {
  key: SignalKey
  weight: number
  params?: Record<string, string | number>
}
export type RiskLevel = 'low' | 'watch' | 'high'
export interface EarlyWarning {
  score: number
  level: RiskLevel
  /** Signals pushing risk up, strongest first. */
  reasons: Signal[]
  /** Signals pulling risk down. */
  mitigating: Signal[]
  confidence: number
  modelVersion: string
}
export interface PlanProgress {
  plan: FollowUpPlan
  elapsed: number
  done: PlanStep[]
  next?: PlanStep
  dueIn?: number
  /** An open call task from the plan (shows in the service desk). */
  callTask?: string
  state: 'running' | 'paused' | 'promise' | 'completed'
}
export interface Borrower extends BorrowerSeed {
  demo: boolean
  risk: EarlyWarning
  segment: SegmentId
  plan?: PlanProgress
  promise?: { date: string; at: string }
  openWayBack: boolean
  contactsThisWeek: number
  flagged: boolean
}

function demoSeed(id: string, s: ProgrammeSettings): BorrowerSeed | null {
  const d = readDb()
  const st = d.students[id]?.student
  const acct = d.repayment[id]
  if (!st || !acct) return null
  const byMonth = new Map(acct.payments.map((p) => [p.at.slice(0, 7), p.status as PayMark]))
  const history: PayMark[] = HISTORY_MONTHS.map((m) => byMonth.get(m) ?? (acct.payments.length && m >= acct.payments[0].at.slice(0, 7) ? 'paid' : 'grace'))
  const missed = acct.payments.filter((p) => p.status === 'missed')
  const behind = acct.status === 'behind'
  const employed = (d.jobLog[id] ?? []).some((e) => e.outcome === 'hired') || d.invitations.some((i) => i.studentId === id && i.stage === 'hired')
  const last = [...d.collections.contacts].filter((c) => c.borrowerId === id).sort((a, b) => b.at.localeCompare(a.at))[0]
  return {
    id,
    code: CODES[id] ?? id,
    name: st.fullName,
    icMasked: st.icMasked,
    institution: st.institution,
    institutionType: 'Public university',
    state: st.state,
    cohort: String(st.graduationYear),
    status: acct.status,
    graceEndsAt: acct.graceEndsAt,
    dpd: behind && missed.length ? daysBetween(missed[0].at, COLLECTIONS_TODAY) : 0,
    instalmentRM: acct.nextPayment?.amountRM ?? 0,
    amountDueRM: behind ? missed.reduce((n, p) => n + p.amountRM, 0) : acct.status === 'grace' ? 0 : (acct.nextPayment?.amountRM ?? 0),
    lastPaymentAt: [...acct.payments].reverse().find((p) => p.status === 'paid')?.at,
    nextDueAt: acct.status === 'grace' ? acct.graceEndsAt : acct.nextPayment?.dueAt,
    method: acct.method,
    history,
    employed,
    jobVerified: buildSummary(id, s).verified,
    jobVerifiedPrev: buildSummary(id, s, '2026-09').verified,
    lastActive: st.lastActive,
    reachable: true,
    unanswered: 0,
    partnerInterest: d.invitations.filter((i) => i.studentId === id).length,
    lastContactAt: last?.at.slice(0, 10),
    planStartedAt: PLAN_START[id] ?? COLLECTIONS_TODAY,
  }
}

/** Deterministic, explainable early-warning score (same input → same output). */
export function earlyWarning(b: BorrowerSeed, s: ProgrammeSettings, extra: { openWayBack: boolean; promise: boolean }): EarlyWarning {
  const threshold = s.jobSeeking.monthlyThreshold
  const signals: Signal[] = []
  const graceDays = b.status === 'grace' && b.graceEndsAt ? daysBetween(COLLECTIONS_TODAY, b.graceEndsAt) : null
  const jobMatters = !b.employed && (b.status !== 'grace' || (graceDays !== null && graceDays <= 180))
  if (graceDays !== null && graceDays <= 90 && !b.employed) signals.push({ key: 'graceEndingNoJob', weight: 35, params: { days: graceDays } })
  if (jobMatters && b.jobVerified < threshold) signals.push(b.jobVerifiedPrev < threshold ? { key: 'jobSearchLowTwice', weight: 25, params: { verified: b.jobVerified, threshold } } : { key: 'jobSearchLow', weight: 20, params: { verified: b.jobVerified, threshold } })
  if (b.status === 'behind') {
    const recent = b.history.slice(-3)
    if (recent.includes('missed')) signals.push({ key: 'missedRecent', weight: 40, params: { count: recent.filter((m) => m === 'missed').length } })
    else if (recent.includes('partial')) signals.push({ key: 'partialRecent', weight: 25 })
    if (b.dpd > 30) signals.push({ key: 'dpdOver30', weight: 15, params: { days: b.dpd } })
  }
  if (daysBetween(b.lastActive, COLLECTIONS_TODAY) > 60) signals.push({ key: 'inactive60', weight: 15 })
  if (!b.reachable || b.unanswered >= 2) signals.push({ key: 'unreachable', weight: 20 })
  if (b.method === 'salaryDeduction') signals.push({ key: 'salaryDeduction', weight: -30 })
  if (b.employed) signals.push({ key: 'employed', weight: -20 })
  if (jobMatters && b.jobVerified >= threshold) signals.push({ key: 'meetsThreshold', weight: -10, params: { verified: b.jobVerified, threshold } })
  if (extra.openWayBack) signals.push({ key: 'openWayBack', weight: -15 })
  if (extra.promise) signals.push({ key: 'promise', weight: -10 })
  const score = Math.max(0, Math.min(100, 10 + signals.reduce((n, x) => n + x.weight, 0)))
  const level: RiskLevel = score >= s.collections.highThreshold ? 'high' : score >= s.collections.watchThreshold ? 'watch' : 'low'
  return {
    score,
    level,
    reasons: signals.filter((x) => x.weight > 0).sort((a, b) => b.weight - a.weight),
    mitigating: signals.filter((x) => x.weight < 0).sort((a, b) => a.weight - b.weight),
    confidence: Math.min(0.93, 0.62 + signals.length * 0.05),
    modelVersion: EW_MODEL_VERSION,
  }
}

/** Rules, not a black box: one segment per borrower, each with a default follow-up plan. */
export function segmentOf(b: BorrowerSeed, s: ProgrammeSettings): SegmentId {
  const searching = b.jobVerified >= Math.ceil(s.jobSeeking.monthlyThreshold / 2)
  const graceDays = b.status === 'grace' && b.graceEndsAt ? daysBetween(COLLECTIONS_TODAY, b.graceEndsAt) : null
  const needsContact = b.status === 'behind' || (graceDays !== null && graceDays <= 90)
  if (needsContact && (!b.reachable || b.unanswered >= 2)) return 'unreachable'
  if (b.status === 'behind') {
    if (b.method === 'restructured') return 'restructuredLate'
    if (b.employed) return 'employedMissed'
    return searching ? 'behindSearching' : 'behindInactive'
  }
  if (graceDays !== null && b.employed) return 'graceHired'
  if (graceDays !== null && graceDays <= 90) return searching ? 'graceSearching' : 'graceInactive'
  return 'onTrack'
}

function planProgress(b: BorrowerSeed, segment: SegmentId, promise: boolean): PlanProgress | undefined {
  const d = readDb().collections
  const plan = d.plans.find((p) => p.segment === segment && p.active)
  if (!plan || !b.planStartedAt) return undefined
  const elapsed = Math.max(0, daysBetween(b.planStartedAt, COLLECTIONS_TODAY))
  const done = plan.steps.filter((x) => x.day <= elapsed)
  const next = plan.steps.find((x) => x.day > elapsed)
  const lastCall = [...done].reverse().find((x) => x.kind === 'call')
  const taskId = lastCall ? `CT-${b.id}-${lastCall.day}` : undefined
  const paused = d.pausedPlans.includes(b.id)
  return {
    plan,
    elapsed,
    done,
    next,
    dueIn: next ? next.day - elapsed : undefined,
    callTask: taskId && !d.doneTasks.includes(taskId) && !paused && !promise ? taskId : undefined,
    state: paused ? 'paused' : promise ? 'promise' : next ? 'running' : 'completed',
  }
}

export function buildBorrowers(s: ProgrammeSettings): Borrower[] {
  const d = readDb().collections
  const seeds = [...(DEMO_IDS.map((id) => demoSeed(id, s)).filter(Boolean) as BorrowerSeed[]), ...BORROWER_SEED]
  const weekAgo = COLLECTIONS_TODAY.slice(0, 8) + String(Number(COLLECTIONS_TODAY.slice(8)) - 6).padStart(2, '0')
  return seeds.map((b) => {
    const promiseRec = d.promises[b.id]
    const promise = promiseRec && promiseRec.date >= COLLECTIONS_TODAY ? promiseRec : undefined
    const openWayBack = d.offers.some((o) => o.borrowerId === b.id && o.status === 'accepted') || !!readDb().repayment[b.id]?.restructureRequest?.status?.startsWith('sub')
    const risk = earlyWarning(b, s, { openWayBack, promise: !!promise })
    const segment = segmentOf(b, s)
    return {
      ...b,
      demo: DEMO_IDS.includes(b.id),
      risk,
      segment,
      plan: segment === 'onTrack' ? undefined : planProgress(b, segment, !!promise),
      promise,
      openWayBack,
      contactsThisWeek: d.contacts.filter((c) => c.borrowerId === b.id && c.at.slice(0, 10) >= weekAgo && (c.kind === 'message' || c.kind === 'call')).length,
      flagged: d.scoreFlags.some((f) => f.borrowerId === b.id),
    }
  })
}

export function listBorrowers(s: ProgrammeSettings) {
  return delay(buildBorrowers(s), 150)
}

export type TimelineItem = { at: string; kind: 'payment' | 'missed' | 'plan' | ContactEvent['kind'] | 'override'; text: LocalizedText | string; by?: string }

export function getBorrower(id: string, s: ProgrammeSettings) {
  const b = buildBorrowers(s).find((x) => x.id === id)
  if (!b) return delay(null, 100)
  const d = readDb()
  const timeline: TimelineItem[] = []
  b.history.forEach((m, i) => {
    if (m === 'paid' || m === 'partial') timeline.push({ at: `${HISTORY_MONTHS[i]}-15`, kind: 'payment', text: m === 'partial' ? { en: 'Partial payment received', ms: 'Bayaran separa diterima' } : { en: 'Payment received', ms: 'Bayaran diterima' } })
    if (m === 'missed') timeline.push({ at: `${HISTORY_MONTHS[i]}-15`, kind: 'missed', text: { en: 'Payment missed', ms: 'Bayaran tertunggak' } })
  })
  for (const step of b.plan?.done ?? [])
    timeline.push({ at: addDays(b.planStartedAt!, step.day), kind: 'plan', text: step.kind === 'call' ? { en: 'Plan: call task created', ms: 'Pelan: tugasan panggilan dicipta' } : { en: `Plan: ${TEMPLATES[step.templateId!].name.en} (${step.channel})`, ms: `Pelan: ${TEMPLATES[step.templateId!].name.ms} (${step.channel})` } })
  for (const c of d.collections.contacts.filter((x) => x.borrowerId === id)) timeline.push({ at: c.at, kind: c.kind, text: c.text, by: c.by })
  for (const o of d.overrides.filter((x) => x.studentId === id && x.status !== 'pending')) timeline.push({ at: o.requestedAt, kind: 'override', text: { en: `Tier override ${o.status}`, ms: `Pengecualian tahap ${o.status}` } })
  timeline.sort((a, b) => b.at.localeCompare(a.at))
  const cases = allCases(s).filter((c) => c.borrowerId === id)
  return delay({ borrower: b, timeline, cases, offers: d.collections.offers.filter((o) => o.borrowerId === id) }, 140)
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------- Officer actions (all audited)

const stamp = (n = 0) => `2026-10-07T${String(10 + Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}:00+08:00`
let seq = 0
const nextId = (p: string) => `${p}-${8000 + ++seq}`

function addContact(e: Omit<ContactEvent, 'id' | 'at'>) {
  writeDb((d) => d.collections.contacts.unshift({ ...e, id: nextId('CE'), at: stamp(seq * 3) }))
}
function notifyStudent(id: string, body: LocalizedText, link = '/s/repayment') {
  if (!DEMO_IDS.includes(id)) return
  writeDb((d) => d.notifications.unshift({ id: nextId('n-col'), studentId: id, type: 'benefits', channel: ['inApp', 'push'], body, at: stamp(seq * 3), read: false, link }))
}

export function revealBorrower(officer: Officer, b: Borrower, reason: string) {
  logAudit(officer, 'Revealed borrower name and IC', 'borrower', b.code, reason)
}

/** Send a template message. Contact caps are enforced by the system, not by memory. */
export async function sendTemplate(officer: Officer, b: Borrower, templateId: TemplateId, channel: ContactChannel, s: ProgrammeSettings) {
  if (b.contactsThisWeek >= s.collections.contactCapPerWeek) throw new Error('cap')
  addContact({ borrowerId: b.id, kind: 'message', channel, text: `${TEMPLATES[templateId].name.en} (${channel})`, by: officer.id })
  notifyStudent(b.id, TEMPLATES[templateId].body)
  logAudit(officer, `Sent message: ${TEMPLATES[templateId].name.en} via ${channel}`, 'borrower', b.code)
  return delay(true, 250)
}

export type CallOutcome = 'reached' | 'noAnswer' | 'wrongNumber' | 'promise'
export async function logCall(officer: Officer, b: Borrower, outcome: CallOutcome, note: string, promiseDate?: string) {
  addContact({ borrowerId: b.id, kind: 'call', text: note || outcome, outcome, by: officer.id })
  writeDb((d) => {
    if (outcome === 'promise' && promiseDate) d.collections.promises[b.id] = { date: promiseDate, at: COLLECTIONS_TODAY }
    if (b.plan?.callTask) d.collections.doneTasks.push(b.plan.callTask)
  })
  logAudit(officer, `Logged call: ${outcome}${promiseDate ? ` (promise ${promiseDate})` : ''}`, 'borrower', b.code, note)
  return delay(true, 200)
}

const OFFER_BODY: Record<WayBackOffer['kind'], LocalizedText> = {
  salaryDeduction: { en: 'PTPTN has offered you salary deduction. Accept it on your Repayment page and your benefits return once it is confirmed.', ms: 'PTPTN menawarkan potongan gaji. Terima di halaman Bayaran Balik dan manfaat anda kembali selepas disahkan.' },
  restructure: { en: 'PTPTN has offered you a restructured plan with lower instalments. Review and accept it on your Repayment page.', ms: 'PTPTN menawarkan pelan penstrukturan semula dengan ansuran lebih rendah. Semak dan terima di halaman Bayaran Balik.' },
  deferment: { en: 'PTPTN has offered you a deferment while you keep searching for work. Review and accept it on your Repayment page.', ms: 'PTPTN menawarkan penangguhan semasa anda terus mencari kerja. Semak dan terima di halaman Bayaran Balik.' },
}
export async function offerWayBack(officer: Officer, b: Borrower, kind: WayBackOffer['kind']) {
  writeDb((d) => d.collections.offers.unshift({ id: nextId('OF'), borrowerId: b.id, kind, by: officer.id, at: COLLECTIONS_TODAY, status: 'sent' }))
  addContact({ borrowerId: b.id, kind: 'offer', text: `Offered ${kind}`, by: officer.id })
  notifyStudent(b.id, OFFER_BODY[kind])
  logAudit(officer, `Offered way back: ${kind}`, 'borrower', b.code)
  return delay(true, 250)
}

export async function togglePlan(officer: Officer, b: Borrower, reason: string) {
  const paused = readDb().collections.pausedPlans.includes(b.id)
  const flip = (to: boolean) => writeDb((d) => (d.collections.pausedPlans = to ? [...d.collections.pausedPlans, b.id] : d.collections.pausedPlans.filter((x) => x !== b.id)))
  flip(!paused)
  logAudit(officer, paused ? 'Resumed follow-up plan' : 'Paused follow-up plan', 'borrower', b.code, reason, () => flip(paused))
  return delay(true, 150)
}

export async function flagScore(officer: Officer, b: Borrower, reason: string) {
  writeDb((d) => d.collections.scoreFlags.push({ borrowerId: b.id, by: officer.id, reason, at: COLLECTIONS_TODAY }))
  logAudit(officer, 'Flagged early-warning score for review', 'borrower', b.code, reason)
  return delay(true, 150)
}

export async function addBorrowerNote(officer: Officer, b: Borrower, text: string) {
  addContact({ borrowerId: b.id, kind: 'note', text, by: officer.id })
  logAudit(officer, 'Added collections note', 'borrower', b.code, text)
  return delay(true, 120)
}

// ---------------------------------------------------------------- Follow-up plans (two-person rule)

export function listPlans(s: ProgrammeSettings) {
  const borrowers = buildBorrowers(s)
  return delay(
    readDb().collections.plans.map((p) => ({ plan: p, inPlan: borrowers.filter((b) => b.segment === p.segment).length, results: PLAN_RESULTS[p.segment] })),
    120,
  )
}

/** Programme-scale preview of a plan: borrowers entering this week and messages it would send. */
export function simulatePlan(plan: FollowUpPlan, s: ProgrammeSettings) {
  const sample = buildBorrowers(s)
  const share = sample.filter((b) => b.segment === plan.segment).length / sample.length
  const entering = Math.round((PROGRAMME_BORROWERS * share) / 4)
  const messages = entering * plan.steps.filter((x) => x.kind === 'message' && x.day <= 7).length
  const calls = entering * plan.steps.filter((x) => x.kind === 'call').length
  return { entering, messages, calls, maxPerWeek: s.collections.contactCapPerWeek, overCap: plan.steps.filter((x) => x.day <= 7).length > s.collections.contactCapPerWeek }
}

export async function proposePlan(officer: Officer, plan: FollowUpPlan, s: ProgrammeSettings) {
  const sim = simulatePlan(plan, s)
  if (s.collections.planApproval === 'single') {
    const next = { ...plan, version: plan.version + 1 }
    writeDb((d) => {
      const i = d.collections.plans.findIndex((p) => p.id === plan.id)
      if (i >= 0) d.collections.plans[i] = next
    })
    logAudit(officer, `Published follow-up plan ${plan.id} v${next.version} (single approver)`, 'plan', plan.id)
    return delay('published' as const, 200)
  }
  return proposeChange(officer, {
    kind: 'plan',
    title: `Follow-up plan ${plan.id}: ${plan.steps.length} steps`,
    detail: `~${sim.entering} borrowers a week · ~${sim.messages} messages · ${sim.calls} call tasks`,
    patch: { plan: { ...plan, version: plan.version + 1 } },
  })
}

/** Called after the second approver publishes the change. */
export function applyPlanChange(cr: ChangeRequest) {
  const plan = (cr.patch as { plan?: FollowUpPlan } | undefined)?.plan
  if (!plan) return
  writeDb((d) => {
    const i = d.collections.plans.findIndex((p) => p.id === plan.id)
    if (i >= 0) d.collections.plans[i] = plan
  })
}

export function templateList() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({ id: id as TemplateId, ...t }))
}

// ---------------------------------------------------------------- Service desk

export interface DeskCase extends ServiceCase {
  /** Plan call tasks are virtual cases generated from follow-up plans. */
  virtual?: boolean
}

function allCases(s: ProgrammeSettings): DeskCase[] {
  const tasks: DeskCase[] = buildBorrowers(s)
    .filter((b) => b.plan?.callTask)
    .map((b) => ({ id: b.plan!.callTask!, borrowerId: b.id, topic: 'planCall' as const, openedAt: addDays(b.planStartedAt!, b.plan!.done.filter((x) => x.kind === 'call').slice(-1)[0].day), status: 'open' as const, assignee: 'off-cs', messages: [], virtual: true }))
  return [...readDb().collections.cases, ...tasks]
}

export function listCases(s: ProgrammeSettings) {
  const borrowers = buildBorrowers(s)
  return delay(
    allCases(s)
      .map((c) => ({ ...c, borrower: borrowers.find((b) => b.id === c.borrowerId)! }))
      .filter((c) => c.borrower)
      .sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved') || a.openedAt.localeCompare(b.openedAt)),
    130,
  )
}

/** Borrower ids an agent is working (open cases or plan call tasks): the CS agent's worklist scope. */
export function agentBorrowerIds(s: ProgrammeSettings) {
  return new Set(allCases(s).filter((c) => c.status === 'open').map((c) => c.borrowerId))
}

const STATUS_TXT: Record<string, LocalizedText> = {
  grace: { en: 'in grace', ms: 'dalam tempoh tangguh' },
  goodStanding: { en: 'in good standing', ms: 'dalam kedudukan baik' },
  behind: { en: 'behind on payments', ms: 'tertunggak bayaran' },
}

/** AI assist for agents: summary, next step and reply drafts. Labelled, editable, never sent automatically. */
export function aiAssist(c: DeskCase, b: Borrower, s: ProgrammeSettings) {
  const threshold = s.jobSeeking.monthlyThreshold
  const bits: LocalizedText[] = [
    { en: `Cohort ${b.cohort}, ${b.institution}.`, ms: `Kohort ${b.cohort}, ${b.institution}.` },
    { en: `Currently ${STATUS_TXT[b.status].en}${b.dpd ? ` (${b.dpd} days past due, RM ${b.amountDueRM})` : ''}.`, ms: `Kini ${STATUS_TXT[b.status].ms}${b.dpd ? ` (${b.dpd} hari lewat, RM ${b.amountDueRM})` : ''}.` },
    b.employed ? { en: 'Employment confirmed.', ms: 'Pekerjaan disahkan.' } : { en: `Job search: ${b.jobVerified} of ${threshold} verified applications this month.`, ms: `Carian kerja: ${b.jobVerified} daripada ${threshold} permohonan disahkan bulan ini.` },
  ]
  const last = c.messages.filter((m) => m.from === 'student').slice(-1)[0]
  if (last) bits.push({ en: `Asked: “${last.body}”`, ms: `Bertanya: “${last.body}”` })
  if (c.topic === 'planCall') bits.push({ en: `Call task from the ${b.segment} follow-up plan.`, ms: `Tugasan panggilan daripada pelan susulan ${b.segment}.` })
  const summary: LocalizedText = { en: bits.map((x) => x.en).join(' '), ms: bits.map((x) => x.ms ?? x.en).join(' ') }

  const offer: WayBackOffer['kind'] = b.employed ? 'salaryDeduction' : b.status === 'grace' ? 'deferment' : b.jobVerified >= Math.ceil(threshold / 2) ? 'restructure' : 'restructure'
  const nextStep: LocalizedText =
    b.status === 'goodStanding'
      ? { en: 'Answer the question; no repayment action needed.', ms: 'Jawab soalan; tiada tindakan bayaran balik diperlukan.' }
      : { en: `Offer ${offer === 'salaryDeduction' ? 'salary deduction' : offer === 'deferment' ? 'a deferment' : 'a restructured plan'}${b.status === 'behind' ? ', or agree a promise-to-pay date' : ''}.`, ms: `Tawarkan ${offer === 'salaryDeduction' ? 'potongan gaji' : offer === 'deferment' ? 'penangguhan' : 'pelan penstrukturan semula'}${b.status === 'behind' ? ', atau persetujuan tarikh janji bayar' : ''}.` }
  const drafts: LocalizedText[] = [
    offer === 'salaryDeduction'
      ? { en: 'Thanks for getting in touch. Since you’re now employed, salary deduction is the easiest way to stay on track: your employer pays each month and your benefits return once it’s confirmed. Shall I send you the offer?', ms: 'Terima kasih kerana menghubungi kami. Memandangkan anda kini bekerja, potongan gaji ialah cara paling mudah untuk kekal di landasan: majikan anda membayar setiap bulan dan manfaat anda kembali selepas disahkan. Boleh saya hantar tawaran?' }
      : offer === 'deferment'
        ? { en: 'Thanks for reaching out. Because you’re actively searching for work, you may qualify for a deferment. I can send you the offer now to review in the app.', ms: 'Terima kasih kerana menghubungi kami. Oleh kerana anda sedang aktif mencari kerja, anda mungkin layak untuk penangguhan. Saya boleh hantar tawaran sekarang untuk anda semak dalam aplikasi.' }
        : { en: 'Thanks for reaching out, and we understand things are tight while you look for work. A restructured plan can lower your instalments, and your job search record supports it. Shall I send the offer to your app?', ms: 'Terima kasih kerana menghubungi kami. Kami faham keadaan sukar semasa anda mencari kerja. Pelan penstrukturan semula boleh mengurangkan ansuran anda, dan rekod carian kerja anda menyokongnya. Boleh saya hantar tawaran ke aplikasi anda?' },
    { en: 'Thanks for your message. I’ve checked your account and will update you within one working day.', ms: 'Terima kasih atas mesej anda. Saya telah menyemak akaun anda dan akan memaklumkan anda dalam satu hari bekerja.' },
  ]
  return { summary, nextStep, offer, drafts, model: 'csassist-0.2 (on-prem)' }
}

export async function replyToCase(officer: Officer, c: DeskCase, b: Borrower, body: string) {
  if (!c.virtual)
    writeDb((d) => {
      const x = d.collections.cases.find((y) => y.id === c.id)!
      x.messages.push({ from: 'agent', body, at: stamp(++seq) })
    })
  addContact({ borrowerId: b.id, kind: 'message', channel: 'inApp', text: `Reply on ${c.id}`, by: officer.id })
  notifyStudent(b.id, { en: `PTPTN replied: ${body}`, ms: `PTPTN membalas: ${body}` })
  logAudit(officer, 'Replied to service case', 'case', c.id, body.slice(0, 80))
  return delay(true, 200)
}

export type Resolution = NonNullable<ServiceCase['resolution']>
export async function resolveCase(officer: Officer, c: DeskCase, b: Borrower, resolution: Resolution, note: string) {
  writeDb((d) => {
    if (c.virtual) d.collections.doneTasks.push(c.id)
    else {
      const x = d.collections.cases.find((y) => y.id === c.id)!
      x.status = 'resolved'
      x.resolution = resolution
    }
  })
  addContact({ borrowerId: b.id, kind: c.virtual ? 'call' : 'case', text: `${c.id}: ${resolution}${note ? ` · ${note}` : ''}`, outcome: resolution, by: officer.id })
  logAudit(officer, `Resolved service case (${resolution})`, 'case', c.id, note)
  return delay(true, 200)
}

// ---------------------------------------------------------------- Student side (Repayment page)

export function getSupport(studentId: string) {
  const d = readDb().collections
  return delay(
    {
      cases: d.cases.filter((c) => c.borrowerId === studentId && c.status === 'open'),
      offers: d.offers.filter((o) => o.borrowerId === studentId && o.status === 'sent'),
      promise: d.promises[studentId] && d.promises[studentId].date >= COLLECTIONS_TODAY ? d.promises[studentId] : undefined,
    },
    120,
  )
}

export async function requestCallback(studentId: string, slot: string, note: string) {
  const id = nextId('SC')
  writeDb((d) => d.collections.cases.unshift({ id, borrowerId: studentId, topic: 'callback', openedAt: COLLECTIONS_TODAY, status: 'open', assignee: 'off-cs', slot, messages: note ? [{ from: 'student', body: note, at: stamp(++seq) }] : [] }))
  addContact({ borrowerId: studentId, kind: 'case', text: `Callback requested: ${slot}`, by: 'student' })
  return delay(id, 300)
}

export async function messagePtptn(studentId: string, body: string) {
  const id = nextId('SC')
  writeDb((d) => d.collections.cases.unshift({ id, borrowerId: studentId, topic: 'message', openedAt: COLLECTIONS_TODAY, status: 'open', assignee: 'off-cs', messages: [{ from: 'student', body, at: stamp(++seq) }] }))
  addContact({ borrowerId: studentId, kind: 'case', text: 'Message sent to PTPTN', by: 'student' })
  return delay(id, 300)
}

/** Accepting an officer's offer submits the same way back as self-service; the sync confirms it. */
export async function acceptOffer(studentId: string, offerId: string) {
  const o = readDb().collections.offers.find((x) => x.id === offerId)!
  writeDb((d) => (d.collections.offers.find((x) => x.id === offerId)!.status = 'accepted'))
  addContact({ borrowerId: studentId, kind: 'offer', text: `Accepted ${o.kind}`, by: 'student' })
  await requestWayBack(studentId, o.kind)
  return true
}

export async function promiseToPay(studentId: string, date: string) {
  writeDb((d) => (d.collections.promises[studentId] = { date, at: COLLECTIONS_TODAY }))
  addContact({ borrowerId: studentId, kind: 'promise', text: `Promised to pay by ${date}`, by: 'student' })
  return delay(true, 250)
}

// ---------------------------------------------------------------- Overview and queues

const RECOVERED_BASE = 4

export function collectionsOverview(s: ProgrammeSettings) {
  const bs = buildBorrowers(s)
  const [b1, b2, b3] = s.collections.dpdBuckets
  const recoveredDemo = DEMO_IDS.filter((id) => REPAYMENT_SEED[id]?.status === 'behind' && readDb().repayment[id]?.status !== 'behind').length
  const bySegment = SEGMENT_ORDER.map((seg) => ({ segment: seg, count: bs.filter((b) => b.segment === seg).length })).filter((x) => x.count)
  const groups = [...new Set(bs.map((b) => b.institutionType))]
  const avgHigh = bs.filter((b) => b.risk.level === 'high').length / bs.length
  const fairness = groups.map((g) => {
    const inG = bs.filter((b) => b.institutionType === g)
    const share = inG.filter((b) => b.risk.level === 'high').length / inG.length
    return { group: g, borrowers: inG.length, highShare: share, flagged: share > avgHigh * 1.15 && inG.length >= 5 }
  })
  return {
    sample: bs.length,
    onTimePct: Math.round((bs.filter((b) => b.status !== 'behind').length / bs.length) * 1000) / 10,
    buckets: [
      { key: 'current', count: bs.filter((b) => b.dpd === 0).length },
      { key: `1–${b1}`, count: bs.filter((b) => b.dpd > 0 && b.dpd <= b1).length },
      { key: `${b1 + 1}–${b2}`, count: bs.filter((b) => b.dpd > b1 && b.dpd <= b2).length },
      { key: `${b2 + 1}–${b3}`, count: bs.filter((b) => b.dpd > b2 && b.dpd <= b3).length },
      { key: `${b3}+`, count: bs.filter((b) => b.dpd > b3).length },
    ],
    watch: bs.filter((b) => b.risk.level === 'watch').length,
    high: bs.filter((b) => b.risk.level === 'high').length,
    recoveries: RECOVERED_BASE + recoveredDemo,
    callTasks: bs.filter((b) => b.plan?.callTask).length,
    stepsDue: bs.filter((b) => b.plan?.state === 'running' && (b.plan.dueIn ?? 99) <= 1).length,
    openCases: readDb().collections.cases.filter((c) => c.status === 'open').length,
    promisesDue: bs.filter((b) => b.promise && b.promise.date <= addDays(COLLECTIONS_TODAY, 7)).length,
    promiseKeptPct: 68,
    bySegment,
    fairness,
    trend: DPD_TREND,
  }
}

/** Command centre queue: High-risk borrowers not contacted in the last 7 days. */
export function earlyWarningQueue(s: ProgrammeSettings) {
  return buildBorrowers(s).filter((b) => b.risk.level === 'high' && b.status !== 'goodStanding' && (!b.lastContactAt || daysBetween(b.lastContactAt, COLLECTIONS_TODAY) > 7))
}

export function openDeskCases(s: ProgrammeSettings) {
  return allCases(s).filter((c) => c.status === 'open')
}

export function signalText(x: Signal): LocalizedText {
  const p = x.params ?? {}
  switch (x.key) {
    case 'graceEndingNoJob':
      return { en: `Grace ends in ${p.days} days, no job confirmed`, ms: `Tempoh tangguh tamat dalam ${p.days} hari, tiada pekerjaan disahkan` }
    case 'jobSearchLow':
      return { en: `Job search below threshold (${p.verified} of ${p.threshold})`, ms: `Carian kerja di bawah ambang (${p.verified} daripada ${p.threshold})` }
    case 'jobSearchLowTwice':
      return { en: `Job search below threshold for 2 months (${p.verified} of ${p.threshold})`, ms: `Carian kerja di bawah ambang selama 2 bulan (${p.verified} daripada ${p.threshold})` }
    case 'missedRecent':
      return { en: `Missed ${p.count} payment${Number(p.count) > 1 ? 's' : ''} in the last 3 months`, ms: `Terlepas ${p.count} bayaran dalam 3 bulan lepas` }
    case 'partialRecent':
      return { en: 'Partial payment in the last 3 months', ms: 'Bayaran separa dalam 3 bulan lepas' }
    case 'dpdOver30':
      return { en: `${p.days} days past due`, ms: `${p.days} hari lewat` }
    case 'inactive60':
      return { en: 'No app activity in 60 days', ms: 'Tiada aktiviti aplikasi dalam 60 hari' }
    case 'unreachable':
      return { en: 'Hard to reach (bounced or unanswered)', ms: 'Sukar dihubungi (gagal atau tidak dijawab)' }
    case 'salaryDeduction':
      return { en: 'Salary deduction active', ms: 'Potongan gaji aktif' }
    case 'employed':
      return { en: 'Employment confirmed', ms: 'Pekerjaan disahkan' }
    case 'meetsThreshold':
      return { en: `Meets job-seeking threshold (${p.verified} of ${p.threshold})`, ms: `Mencapai ambang mencari kerja (${p.verified} daripada ${p.threshold})` }
    case 'openWayBack':
      return { en: 'Way back requested', ms: 'Cara kembali dipohon' }
    case 'promise':
      return { en: 'Promise to pay in place', ms: 'Janji bayar sedang berkuat kuasa' }
  }
}

export function templateText(id: TemplateId) {
  return TEMPLATES[id]
}

export { CURRENT_MONTH }
