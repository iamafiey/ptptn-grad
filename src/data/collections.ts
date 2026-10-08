import type { ContactChannel } from '@/config/programmeSettings'
import type { LocalizedText, RepaymentStatus } from '@/types/domain'
import { DIRECTORY } from './agency6'

// Collections & customer service (docs/collections-flow.md). Fictional borrower accounts as the nightly
// repayment sync would deliver them, plus platform signals, follow-up plans, templates and service cases.

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)]
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const COLLECTIONS_TODAY = '2026-10-07'

/** One month in the 12-month payment strip (Oct 2025 – Sep 2026). */
export type PayMark = 'paid' | 'missed' | 'partial' | 'grace'
export const HISTORY_MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

export interface BorrowerSeed {
  id: string
  code: string
  name: string
  icMasked: string
  institution: string
  institutionType: string
  state: string
  cohort: string
  status: RepaymentStatus
  graceEndsAt?: string
  /** Days past due (0 when current or in grace). */
  dpd: number
  instalmentRM: number
  amountDueRM: number
  lastPaymentAt?: string
  nextDueAt?: string
  method?: 'manual' | 'salaryDeduction' | 'restructured'
  history: PayMark[]
  employed: boolean
  jobVerified: number
  jobVerifiedPrev: number
  lastActive: string
  reachable: boolean
  unanswered: number
  partnerInterest: number
  lastContactAt?: string
  /** Day the borrower entered their current follow-up plan. */
  planStartedAt?: string
}

/** Synthetic borrowers: the agency directory's 60 graduates, with accounts consistent with their tier. */
export const BORROWER_SEED: BorrowerSeed[] = DIRECTORY.map((s, i) => {
  const r = rng(9100 + i * 7)
  const behind = s.tier === 'B'
  const graduatedLongAgo = s.graduationYear <= 2024
  const inGrace = !behind && !graduatedLongAgo && r() < 0.55
  const status: RepaymentStatus = behind ? 'behind' : inGrace ? 'grace' : 'goodStanding'
  const instalmentRM = pick(r, [120, 150, 180, 200, 230, 260])
  const method = status === 'grace' ? undefined : behind ? pick(r, ['manual', 'manual', 'restructured'] as const) : pick(r, ['manual', 'salaryDeduction', 'salaryDeduction', 'restructured'] as const)
  const missedMonths = behind ? 1 + Math.floor(r() * 3) : 0
  const dpd = behind ? 15 + (missedMonths - 1) * 30 + Math.floor(r() * 20) : 0
  const partial = behind && r() < 0.3
  const paidFrom = status === 'grace' ? 12 : Math.floor(r() * 5)
  const history: PayMark[] = HISTORY_MONTHS.map((_, m) => {
    if (m < paidFrom) return 'grace'
    if (behind && m >= 12 - missedMonths) return partial && m === 11 ? 'partial' : 'missed'
    return 'paid'
  })
  const graceEndsAt = status === 'grace' ? addDays(COLLECTIONS_TODAY, 10 + Math.floor(r() * 220)) : undefined
  const employed = s.stage === 'hired' || (s.stage === 'offer' && r() < 0.5) || (!behind && status === 'goodStanding' && r() < 0.6)
  const jobVerified = employed ? 0 : Math.floor(r() * 7)
  const reachable = r() > 0.12
  const lastContactDays = Math.floor(r() * 40)
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    icMasked: s.icMasked,
    institution: s.institution,
    institutionType: s.institutionType,
    state: s.state,
    cohort: s.cohort,
    status,
    graceEndsAt,
    dpd,
    instalmentRM,
    amountDueRM: behind ? instalmentRM * missedMonths - (partial ? Math.round(instalmentRM / 2) : 0) : status === 'grace' ? 0 : instalmentRM,
    lastPaymentAt: status === 'grace' ? undefined : addDays('2026-09-15', behind ? -30 * missedMonths : 0),
    nextDueAt: status === 'grace' ? graceEndsAt : '2026-10-15',
    method,
    history,
    employed,
    jobVerified,
    jobVerifiedPrev: employed ? 0 : Math.floor(r() * 7),
    lastActive: s.lastActive,
    reachable,
    unanswered: reachable ? Math.floor(r() * 2) : 2 + Math.floor(r() * 2),
    partnerInterest: s.invitations + Math.floor(r() * 6),
    lastContactAt: r() < 0.7 ? addDays(COLLECTIONS_TODAY, -lastContactDays) : undefined,
    planStartedAt: addDays(COLLECTIONS_TODAY, -Math.floor(r() * 12)),
  }
})

// ---------------------------------------------------------------- Segments, plans and templates

export type SegmentId = 'onTrack' | 'graceHired' | 'graceSearching' | 'graceInactive' | 'employedMissed' | 'behindSearching' | 'behindInactive' | 'unreachable' | 'restructuredLate'
export const SEGMENT_ORDER: SegmentId[] = ['behindInactive', 'employedMissed', 'behindSearching', 'restructuredLate', 'unreachable', 'graceInactive', 'graceSearching', 'graceHired', 'onTrack']

export interface PlanStep {
  /** Days after the borrower enters the plan. */
  day: number
  kind: 'message' | 'call'
  channel?: ContactChannel
  templateId?: TemplateId
}
export interface FollowUpPlan {
  id: string
  segment: SegmentId
  active: boolean
  version: number
  steps: PlanStep[]
}

export type TemplateId = 'setupRepayment' | 'defermentInfo' | 'reengage' | 'salaryDeduction' | 'restructureOffer' | 'verifyContact' | 'gentleReminder' | 'waysBack'
/** Student-facing messages: ways back first, no threatening language. */
export const TEMPLATES: Record<TemplateId, { name: LocalizedText; body: LocalizedText }> = {
  setupRepayment: {
    name: { en: 'Set up repayment early', ms: 'Sediakan bayaran balik awal' },
    body: { en: 'Congratulations on your new job! Set up salary deduction now and your repayments run on their own, with all benefits kept.', ms: 'Tahniah atas pekerjaan baharu anda! Sediakan potongan gaji sekarang dan bayaran balik berjalan sendiri, dengan semua manfaat kekal.' },
  },
  defermentInfo: {
    name: { en: 'Deferment information', ms: 'Maklumat penangguhan' },
    body: { en: 'Your grace period ends soon. Still searching? Your verified job search can support a deferment. See your options on the Repayment page.', ms: 'Tempoh tangguh anda hampir tamat. Masih mencari kerja? Rekod carian kerja anda boleh menyokong penangguhan. Lihat pilihan di halaman Bayaran Balik.' },
  },
  reengage: {
    name: { en: 'Re-engage: new matches', ms: 'Libat semula: padanan baharu' },
    body: { en: 'New roles match your skills this week. Log your applications to keep your job-seeking record active before your grace period ends.', ms: 'Peranan baharu sepadan dengan kemahiran anda minggu ini. Log permohonan anda untuk mengekalkan rekod mencari kerja sebelum tempoh tangguh tamat.' },
  },
  salaryDeduction: {
    name: { en: 'Salary deduction offer', ms: 'Tawaran potongan gaji' },
    body: { en: 'We noticed a missed payment. Salary deduction keeps you on track automatically and restores your benefits once confirmed.', ms: 'Kami dapati satu bayaran tertunggak. Potongan gaji memastikan anda kekal di landasan secara automatik dan manfaat dipulihkan selepas disahkan.' },
  },
  restructureOffer: {
    name: { en: 'Restructure offer', ms: 'Tawaran penstrukturan semula' },
    body: { en: 'Searching for work and finding payments hard? A restructured plan can lower your instalments. Your job search record supports your request.', ms: 'Sedang mencari kerja dan sukar membayar? Pelan penstrukturan semula boleh mengurangkan ansuran anda. Rekod carian kerja anda menyokong permohonan.' },
  },
  verifyContact: {
    name: { en: 'Verify contact details', ms: 'Sahkan butiran hubungan' },
    body: { en: 'Please check your phone number and email in the app so we can reach you about your benefits.', ms: 'Sila semak nombor telefon dan e-mel anda dalam aplikasi supaya kami dapat menghubungi anda tentang manfaat anda.' },
  },
  gentleReminder: {
    name: { en: 'Gentle reminder', ms: 'Peringatan mesra' },
    body: { en: 'A friendly reminder: your plan payment is due. If something has changed, tap Talk to us and we will help.', ms: 'Peringatan mesra: bayaran pelan anda perlu dijelaskan. Jika ada perubahan, ketik Hubungi kami dan kami akan bantu.' },
  },
  waysBack: {
    name: { en: 'Ways back to good standing', ms: 'Cara kembali ke kedudukan baik' },
    body: { en: 'Some benefits are paused. You can get them back by paying, setting up salary deduction or asking for a restructured plan.', ms: 'Beberapa manfaat digantung. Anda boleh mendapatkannya semula dengan membayar, menyediakan potongan gaji atau memohon pelan penstrukturan semula.' },
  },
}

export const PLANS_SEED: FollowUpPlan[] = [
  { id: 'FP-graceHired', segment: 'graceHired', active: true, version: 2, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'setupRepayment' }, { day: 7, kind: 'message', channel: 'email', templateId: 'setupRepayment' }] },
  { id: 'FP-graceSearching', segment: 'graceSearching', active: true, version: 1, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'defermentInfo' }, { day: 10, kind: 'message', channel: 'sms', templateId: 'defermentInfo' }] },
  { id: 'FP-graceInactive', segment: 'graceInactive', active: true, version: 1, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'reengage' }, { day: 5, kind: 'message', channel: 'sms', templateId: 'reengage' }, { day: 12, kind: 'message', channel: 'email', templateId: 'defermentInfo' }] },
  { id: 'FP-employedMissed', segment: 'employedMissed', active: true, version: 3, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'salaryDeduction' }, { day: 3, kind: 'message', channel: 'sms', templateId: 'salaryDeduction' }, { day: 7, kind: 'call' }] },
  { id: 'FP-behindSearching', segment: 'behindSearching', active: true, version: 2, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'restructureOffer' }, { day: 5, kind: 'message', channel: 'email', templateId: 'waysBack' }, { day: 10, kind: 'call' }] },
  { id: 'FP-behindInactive', segment: 'behindInactive', active: true, version: 1, steps: [{ day: 0, kind: 'message', channel: 'sms', templateId: 'waysBack' }, { day: 4, kind: 'call' }, { day: 9, kind: 'message', channel: 'email', templateId: 'restructureOffer' }] },
  { id: 'FP-unreachable', segment: 'unreachable', active: true, version: 1, steps: [{ day: 0, kind: 'message', channel: 'email', templateId: 'verifyContact' }, { day: 2, kind: 'call' }] },
  { id: 'FP-restructuredLate', segment: 'restructuredLate', active: true, version: 1, steps: [{ day: 0, kind: 'message', channel: 'inApp', templateId: 'gentleReminder' }, { day: 6, kind: 'call' }] },
]

// ---------------------------------------------------------------- Service desk

export type CaseTopic = 'callback' | 'message' | 'planCall' | 'paymentQuestion'
export interface ServiceCase {
  id: string
  borrowerId: string
  topic: CaseTopic
  openedAt: string
  status: 'open' | 'resolved'
  assignee: string
  slot?: string
  messages: { from: 'student' | 'agent'; body: string; at: string }[]
  resolution?: 'resolved' | 'wayBackOffered' | 'promiseToPay' | 'escalated' | 'wrongContact'
}

export const CASES_SEED: ServiceCase[] = [
  { id: 'SC-7101', borrowerId: 'stu-4', topic: 'paymentQuestion', openedAt: '2026-10-06', status: 'open', assignee: 'off-cs', messages: [{ from: 'student', body: 'I paid on 1 Oct but the app still shows a missed payment. Can you check?', at: '2026-10-06T19:12:00+08:00' }] },
  { id: 'SC-7102', borrowerId: 'stu-11', topic: 'callback', openedAt: '2026-10-07', status: 'open', assignee: 'off-cs', slot: 'Today, 2pm–4pm', messages: [{ from: 'student', body: 'Please call me about lowering my instalments.', at: '2026-10-07T08:40:00+08:00' }] },
  { id: 'SC-7103', borrowerId: 'stu-23', topic: 'message', openedAt: '2026-10-05', status: 'open', assignee: 'off-cs', messages: [{ from: 'student', body: 'My employer says they can do salary deduction. What do they need from me?', at: '2026-10-05T12:05:00+08:00' }] },
  { id: 'SC-7104', borrowerId: 'stu-37', topic: 'message', openedAt: '2026-10-02', status: 'open', assignee: 'off-cs', messages: [{ from: 'student', body: 'Saya masih mencari kerja. Boleh saya tangguhkan bayaran?', at: '2026-10-02T21:30:00+08:00' }] },
  { id: 'SC-7090', borrowerId: 'stu-8', topic: 'paymentQuestion', openedAt: '2026-09-28', status: 'resolved', assignee: 'off-cs', resolution: 'resolved', messages: [{ from: 'student', body: 'How do I get a payment receipt?', at: '2026-09-28T10:00:00+08:00' }, { from: 'agent', body: 'You can download receipts from the official PTPTN portal under Payment history.', at: '2026-09-28T11:20:00+08:00' }] },
]

/** Borrowers past due per month, programme-wide (fictional): 1–30, 31–60 and 61+ days. */
export const DPD_TREND = [
  { month: '2025-10', b1: 1420, b2: 610, b3: 540 },
  { month: '2025-11', b1: 1460, b2: 640, b3: 560 },
  { month: '2025-12', b1: 1610, b2: 700, b3: 590 },
  { month: '2026-01', b1: 1540, b2: 690, b3: 610 },
  { month: '2026-02', b1: 1490, b2: 660, b3: 600 },
  { month: '2026-03', b1: 1450, b2: 640, b3: 580 },
  { month: '2026-04', b1: 1400, b2: 610, b3: 560 },
  { month: '2026-05', b1: 1360, b2: 590, b3: 540 },
  { month: '2026-06', b1: 1330, b2: 560, b3: 520 },
  { month: '2026-07', b1: 1300, b2: 540, b3: 505 },
  { month: '2026-08', b1: 1340, b2: 530, b3: 490 },
  { month: '2026-09', b1: 1270, b2: 510, b3: 470 },
]

/** Plan effectiveness over the last 90 days (programme-wide, fictional). */
export const PLAN_RESULTS: Record<SegmentId, { entered: number; paidWithin30: number }> = {
  onTrack: { entered: 0, paidWithin30: 0 },
  graceHired: { entered: 1840, paidWithin30: 1310 },
  graceSearching: { entered: 2260, paidWithin30: 0 },
  graceInactive: { entered: 1730, paidWithin30: 0 },
  employedMissed: { entered: 1120, paidWithin30: 760 },
  behindSearching: { entered: 1460, paidWithin30: 520 },
  behindInactive: { entered: 980, paidWithin30: 240 },
  unreachable: { entered: 640, paidWithin30: 110 },
  restructuredLate: { entered: 410, paidWithin30: 270 },
}

/** Segment names for report tables (the UI uses col.seg.* keys). */
export const SEGMENT_NAMES: Record<SegmentId, LocalizedText> = {
  onTrack: { en: 'On track', ms: 'Di landasan' },
  graceHired: { en: 'Grace · hired', ms: 'Tangguh · bekerja' },
  graceSearching: { en: 'Grace ending · searching', ms: 'Tangguh hampir tamat · mencari' },
  graceInactive: { en: 'Grace ending · inactive', ms: 'Tangguh hampir tamat · tidak aktif' },
  employedMissed: { en: 'Employed · missed payment', ms: 'Bekerja · terlepas bayaran' },
  behindSearching: { en: 'Behind · searching', ms: 'Tertunggak · mencari' },
  behindInactive: { en: 'Behind · no recent activity', ms: 'Tertunggak · tiada aktiviti' },
  unreachable: { en: 'Unreachable', ms: 'Tidak dapat dihubungi' },
  restructuredLate: { en: 'Restructured · late', ms: 'Distruktur semula · lewat' },
}
