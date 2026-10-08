import type { Alert, AuditEntry, EvidenceCheckResult, JobLogEntry, LocalizedText, OfficerRole, Placement, QueueDef, QueueId } from '@/types/domain'
import { asset } from '@/lib/asset'

// Agency seed data. Synthetic rows are generated from a fixed seed, so every run is identical.
// "Today" is Wed 7 Oct 2026. All people, ICs and companies are fictional.

export const TODAY = '2026-10-07'

/** Deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]

/** ISO date `n` working days (Mon–Fri) before today. */
// Calendar maths in UTC on date-only values, so results don't shift with the viewer's timezone.
export function workingDaysAgo(n: number) {
  const d = new Date(`${TODAY}T00:00:00Z`)
  let left = n
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1)
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) left--
  }
  return d.toISOString().slice(0, 10)
}

export const QUEUE_DEFS: QueueDef[] = [
  { id: 'evidence', ownerRole: 'programmeOfficer', title: { en: 'Job search evidence', ms: 'Bukti carian kerja' }, slaWorkingDays: 3 },
  { id: 'placements', ownerRole: 'programmeOfficer', title: { en: 'Placement confirmations', ms: 'Pengesahan penempatan' }, slaWorkingDays: 5 },
  { id: 'partnerRoleApprovals', ownerRole: 'programmeOfficer', title: { en: 'Partner role approvals', ms: 'Kelulusan jawatan rakan kongsi' }, slaWorkingDays: 2 },
  { id: 'partnerApplications', ownerRole: 'partnershipManager', title: { en: 'Partner applications and reports', ms: 'Permohonan dan laporan rakan kongsi' }, slaWorkingDays: 0 },
  { id: 'portalFeedIssues', ownerRole: 'partnershipManager', title: { en: 'Portal feed issues', ms: 'Isu suapan portal' }, slaWorkingDays: 1 },
  { id: 'skillDisputes', ownerRole: 'aiGovernanceLead', title: { en: 'Skill disputes', ms: 'Pertikaian kemahiran' }, slaWorkingDays: 5 },
  { id: 'lowConfidence', ownerRole: 'aiGovernanceLead', title: { en: 'Low-confidence profiles', ms: 'Profil keyakinan rendah' }, slaWorkingDays: 5 },
  { id: 'tierOverrides', ownerRole: 'collectionLiaison', title: { en: 'Tier overrides', ms: 'Pengecualian tahap' }, slaWorkingDays: 1 },
  { id: 'courseSubmissions', ownerRole: 'learningManager', title: { en: 'Course submissions', ms: 'Penyerahan kursus' }, slaWorkingDays: 5 },
]

// ---------------------------------------------------------------- Evidence cases (synthetic)

export interface EvidenceCase {
  id: string
  studentCode: string
  institution: string
  entry: JobLogEntry
  preview: string
  /** Set when an officer decides. */
  decision?: 'verified' | 'rejected' | 'flagged'
}

const INSTITUTIONS = ['UiTM', 'UKM', 'UPM', 'USM', 'UTM', 'UUM', 'UMS', 'UNIMAS', 'UTHM', 'UniMAP', 'UMP', 'UniKL']
const COMPANIES_UNKNOWN = ['Syarikat Bintang Timur Trading', 'Mega Jaya Ventures', 'Seri Alam Holdings', 'Nusa Prima Services', 'Kencana Global Resources']
const COMPANIES_KNOWN = ['Teras Niaga Distribution', 'Laju Haulage Sdn Bhd', 'Harum Foods Manufacturing', 'Pantas Express Sdn Bhd', 'Delima Insurance Berhad', 'Sembang Software', 'Kedai Rakyat Holdings', 'Arus Murni Engineering']
const ROLES = ['Admin Executive', 'Sales Executive', 'Account Assistant', 'Operations Executive', 'Marketing Executive', 'Junior Engineer', 'Customer Service Executive', 'HR Assistant', 'Data Entry Executive', 'Logistics Assistant']
const PORTALS = ['KerjaKini', 'LaluanKerjaya', 'Company website', 'LinkedIn', 'Walk-in']

type Reason = { key: 'companyNotFound' | 'edited' | 'oldDate' | 'lowConfidence' | 'duplicate'; preview: string; conf: number; text: LocalizedText; checks: Partial<EvidenceCheckResult['checks']> }
const REASONS: Reason[] = [
  { key: 'companyNotFound', preview: asset('evidence/unknown-company.svg'), conf: 0.62, text: { en: 'Company not found in the business registry', ms: 'Syarikat tiada dalam daftar perniagaan' }, checks: { companyExists: 'warn' } },
  { key: 'edited', preview: asset('evidence/edited-screenshot.svg'), conf: 0.57, text: { en: 'Possible edited image', ms: 'Imej mungkin disunting' }, checks: { editedImage: 'warn' } },
  { key: 'oldDate', preview: asset('evidence/old-email.svg'), conf: 0.66, text: { en: 'Date outside the application period', ms: 'Tarikh di luar tempoh permohonan' }, checks: { dateInPeriod: 'fail' } },
  { key: 'lowConfidence', preview: asset('evidence/portal-screenshot.svg'), conf: 0.78, text: { en: 'Confidence below the auto-verify threshold', ms: 'Keyakinan di bawah ambang pengesahan automatik' }, checks: {} },
  { key: 'duplicate', preview: asset('evidence/confirmation-email.svg'), conf: 0.52, text: { en: 'Same image used by another student', ms: 'Imej sama digunakan oleh pelajar lain' }, checks: { duplicateImage: 'fail' } },
]

// 45 synthetic + 2 real (Hafiz, Kavitha) = 47 open. Ages spread to 4 working days; 6 are overdue (SLA 3).
const AGE_PLAN = [4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, ...Array(12).fill(2), ...Array(10).fill(1), ...Array(9).fill(0)]

export function buildEvidenceCases(): EvidenceCase[] {
  const r = rng(20261007)
  return AGE_PLAN.map((age, i) => {
    const reason = REASONS[i % REASONS.length]
    const code = `S-${String(21000 + Math.floor(r() * 8000))}`
    const company = reason.key === 'companyNotFound' ? pick(r, COMPANIES_UNKNOWN) : pick(r, COMPANIES_KNOWN)
    const applied = workingDaysAgo(age)
    const entry: JobLogEntry = {
      id: `ev-case-${i + 1}`,
      studentId: code,
      source: 'portalOther',
      portalName: pick(r, PORTALS),
      role: pick(r, ROLES),
      company,
      appliedAt: applied,
      status: 'underReview',
      outcome: 'applied',
      check: {
        checkId: `chk-case-${i + 1}`,
        modelVersion: 'evidencecheck-0.9 (on-prem)',
        checkedAt: `${applied}T${String(9 + (i % 8)).padStart(2, '0')}:15:00+08:00`,
        confidence: Number((reason.conf + (r() - 0.5) * 0.06).toFixed(2)),
        extracted: { company, role: undefined, portal: undefined, date: reason.key === 'oldDate' ? '2025-11-02' : applied },
        checks: { readable: 'pass', companyExists: 'pass', matchesEntry: 'pass', dateInPeriod: 'pass', duplicateImage: 'pass', editedImage: 'pass', ...reason.checks },
        decision: 'escalated',
        reasons: [reason.text],
      },
    }
    entry.check!.extracted.role = entry.role
    entry.check!.extracted.portal = entry.portalName
    return { id: `EV-${30100 + i}`, studentCode: code, institution: pick(r, INSTITUTIONS), entry, preview: reason.preview }
  })
}

// ---------------------------------------------------------------- Other queues (synthetic items)

export interface GenericCase {
  id: string
  queueId: QueueId
  subject: string
  reason: LocalizedText
  ai?: { action: 'approve' | 'reject' | 'escalate'; confidence: number; rationale: string }
  createdAt: string
  detail: { label: string; value: string }[]
  status: 'open' | 'approved' | 'rejected' | 'escalated'
}

function genericCases(): GenericCase[] {
  const r = rng(7102026)
  const out: GenericCase[] = []
  const add = (queueId: QueueId, n: number, ages: number[], make: (i: number) => Omit<GenericCase, 'id' | 'queueId' | 'createdAt' | 'status'>) => {
    for (let i = 0; i < n; i++) out.push({ id: `${queueId.slice(0, 3).toUpperCase()}-${4100 + i}`, queueId, createdAt: workingDaysAgo(ages[i % ages.length]), status: 'open', ...make(i) })
  }
  add('placements', 12, [6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0], (i) => ({
    subject: `Student S-${22000 + i * 137}`,
    reason: i % 3 === 0 ? { en: 'Offer letter to review (open market hire)', ms: 'Surat tawaran untuk disemak (pasaran terbuka)' } : { en: 'Partner marked hired; student has not confirmed', ms: 'Rakan kongsi menanda diambil; pelajar belum mengesahkan' },
    ai: { action: i % 3 === 0 ? 'approve' : 'escalate', confidence: Number((0.7 + r() * 0.25).toFixed(2)), rationale: i % 3 === 0 ? 'Offer letter matches employer and role; salary band readable.' : 'Waiting on student confirmation for more than 3 days.' },
    detail: [
      { label: 'Employer', value: pick(r, ['Seri Mutiara Logistik Berhad', 'Awan Teknologi Sdn Bhd', 'Teras Niaga Distribution', 'Harum Foods Manufacturing']) },
      { label: 'Role', value: pick(r, ROLES) },
      { label: 'Salary band', value: pick(r, ['RM 3,000–3,499', 'RM 3,500–3,999', 'RM 4,000–4,499']) },
    ],
  }))
  add('partnerApplications', 4, [0, 0, 1, 2], (i) =>
    [
      { subject: 'Report: Dian Retail Group', reason: { en: 'Student report: asked to pay a “training fee”', ms: 'Laporan pelajar: diminta membayar “yuran latihan”' }, ai: { action: 'escalate' as const, confidence: 0.91, rationale: 'Fee-request keywords detected in partner chat.' }, detail: [{ label: 'Reported by', value: 'Student S-23880' }, { label: 'Channel', value: 'In-platform chat' }] },
      { subject: 'Application: Merdu Telekom Berhad', reason: { en: 'New Talent Partner application, verification in progress', ms: 'Permohonan Rakan Bakat baharu, pengesahan sedang berjalan' }, ai: { action: 'approve' as const, confidence: 0.84, rationale: 'SSM and domain verified; HR contacts pending.' }, detail: [{ label: 'Sector', value: 'Telecommunications' }, { label: 'Roles per year', value: '25' }] },
      { subject: 'Application: Bayu Harapan Insurans', reason: { en: 'New Talent Partner application', ms: 'Permohonan Rakan Bakat baharu' }, ai: { action: 'approve' as const, confidence: 0.77, rationale: 'Domain verified; agreement draft received.' }, detail: [{ label: 'Sector', value: 'Insurance' }, { label: 'Roles per year', value: '12' }] },
      { subject: 'Report: Lestari Bina Berhad', reason: { en: 'Student report: no response for 3 weeks after interview', ms: 'Laporan pelajar: tiada maklum balas 3 minggu selepas temu duga' }, ai: { action: 'escalate' as const, confidence: 0.62, rationale: 'Partner avg response time is 110 hours.' }, detail: [{ label: 'Reported by', value: 'Student S-27104' }] },
    ][i],
  )
  add('portalFeedIssues', 2, [1, 0], (i) =>
    [
      { subject: 'LaluanKerjaya feed', reason: { en: 'Feed stale for 3 days', ms: 'Suapan tidak dikemas kini selama 3 hari' }, ai: { action: 'escalate' as const, confidence: 0.95, rationale: 'Last successful sync 4 Oct 06:00.' }, detail: [{ label: 'Last sync', value: '4 Oct 2026, 06:00' }, { label: 'Listings', value: '12' }] },
      { subject: 'Listing KK-1184 (KerjaKini)', reason: { en: 'Listing reported: “commission only”', ms: 'Senarai dilaporkan: “komisen sahaja”' }, ai: { action: 'reject' as const, confidence: 0.81, rationale: 'Feed rule: salary must be shown; listing shows commission only.' }, detail: [{ label: 'Reports', value: '3 students' }] },
    ][i],
  )
  add('lowConfidence', 21, [5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], (i) => ({
    subject: `Student S-${25000 + i * 97}`,
    reason: { en: 'Profile confidence below threshold; held back from employers', ms: 'Keyakinan profil di bawah ambang; disembunyikan daripada majikan' },
    ai: { action: 'escalate', confidence: Number((0.42 + r() * 0.16).toFixed(2)), rationale: 'Short activity descriptions; no evidence attached.' },
    detail: [{ label: 'Institution', value: pick(r, INSTITUTIONS) }, { label: 'Skills', value: String(4 + Math.floor(r() * 6)) }],
  }))
  add('tierOverrides', 5, [2, 1, 1, 0, 0], (i) => ({
    subject: `Student S-${26000 + i * 173}`,
    reason: { en: 'Payment made but not yet synced', ms: 'Bayaran dibuat tetapi belum disegerakkan' },
    ai: { action: 'approve', confidence: Number((0.8 + r() * 0.15).toFixed(2)), rationale: 'Receipt reference matches bank format.' },
    detail: [{ label: 'Proof', value: 'Bank receipt' }, { label: 'Override period', value: '14 days' }],
  }))
  add('courseSubmissions', 2, [3, 1], (i) =>
    [
      { subject: 'Customer Experience Essentials · Cakna Kerjaya', reason: { en: 'New course; AI suggests Customer service, Conflict resolution', ms: 'Kursus baharu; AI mencadangkan Khidmat pelanggan, Penyelesaian konflik' }, ai: { action: 'approve' as const, confidence: 0.79, rationale: 'Syllabus covers 4 of 5 rubric criteria.' }, detail: [{ label: 'Cost', value: 'Subsidised · RM 59' }] },
      { subject: 'Data Storytelling · Akademi Digital', reason: { en: 'Updated syllabus', ms: 'Sukatan dikemas kini' }, ai: { action: 'approve' as const, confidence: 0.88, rationale: 'Maps to Data visualisation (Working).' }, detail: [{ label: 'Cost', value: 'Free' }] },
    ][i],
  )
  return out
}

export const GENERIC_CASES = genericCases()

// ---------------------------------------------------------------- Placements

export const PLACEMENTS: Placement[] = (() => {
  const r = rng(284)
  const employers = ['Seri Mutiara Logistik Berhad', 'Awan Teknologi Sdn Bhd', 'Rimba Agro Berhad', 'Selat Capital Berhad', 'Teras Niaga Distribution', 'Harum Foods Manufacturing', 'Permata Health Group', 'Arus Murni Engineering']
  return Array.from({ length: 18 }, (_, i) => {
    const source: Placement['source'] = i % 3 === 0 ? 'portal' : i % 5 === 0 ? 'other' : 'talentPartner'
    return {
      id: `PL-${7200 + i}`,
      studentId: `S-${21000 + Math.floor(r() * 8000)}`,
      employer: pick(r, employers),
      role: pick(r, ROLES),
      salaryBand: pick(r, ['RM 3,000–3,499', 'RM 3,500–3,999', 'RM 4,000–4,499', 'RM 4,500–4,999']),
      startDate: `2026-${pick(r, ['09', '10', '10', '11'])}-${String(1 + Math.floor(r() * 27)).padStart(2, '0')}`,
      source,
      daysToHire: 18 + Math.floor(r() * 70),
      verification: source === 'talentPartner' ? 'autoVerified' : i % 4 === 0 ? 'pending' : 'verified',
    }
  })
})()

// ---------------------------------------------------------------- Home: pulse, alerts

export const PULSE: { id: string; label: LocalizedText; value: number; previous: number; format: 'number' | 'percent' }[] = [
  { id: 'visible', label: { en: 'Students visible', ms: 'Pelajar boleh dilihat' }, value: 18420, previous: 17345, format: 'number' },
  { id: 'partners', label: { en: 'Active Talent Partners', ms: 'Rakan Bakat aktif' }, value: 8, previous: 7, format: 'number' },
  { id: 'verified', label: { en: 'Verified job search entries', ms: 'Rekod carian kerja disahkan' }, value: 6312, previous: 5688, format: 'number' },
  { id: 'placements', label: { en: 'Placements this month', ms: 'Penempatan bulan ini' }, value: 284, previous: 261, format: 'number' },
  { id: 'tierA', label: { en: 'Tier A share', ms: 'Bahagian Tahap A' }, value: 81, previous: 79.6, format: 'percent' },
]

export const ALERTS: (Alert & { roles: OfficerRole[] })[] = [
  { id: 'al-sync', kind: 'syncFailed', message: { en: 'Repayment sync failed at 02:00. Retrying hourly; no tier downgrades on missing data.', ms: 'Segerak bayaran balik gagal pada 02:00. Cuba semula setiap jam; tiada penurunan tahap untuk data yang hilang.' }, at: '2026-10-07T02:05:00+08:00', link: '/a/tiers/sync', severity: 'attention', roles: ['collectionLiaison', 'superAdmin', 'leadershipViewer'] },
  { id: 'al-feed', kind: 'feedStale', message: { en: 'LaluanKerjaya feed is stale (3 days). Students see 12 older listings.', ms: 'Suapan LaluanKerjaya tidak dikemas kini (3 hari).' }, at: '2026-10-07T06:00:00+08:00', link: '/a/partners/portals', severity: 'attention', roles: ['partnershipManager', 'superAdmin', 'leadershipViewer'] },
  { id: 'al-spike', kind: 'escalationSpike', message: { en: 'Evidence escalations up 38% vs the 7-day average, mostly “company not found”.', ms: 'Eskalasi bukti naik 38% berbanding purata 7 hari.' }, at: '2026-10-07T08:30:00+08:00', link: '/a/job-search/monitor', severity: 'attention', roles: ['programmeOfficer', 'superAdmin', 'leadershipViewer'] },
  { id: 'al-ai', kind: 'aiConfidenceDrop', message: { en: 'Average skill confidence for diploma programmes fell from 0.81 to 0.77 this week.', ms: 'Purata keyakinan kemahiran untuk program diploma turun daripada 0.81 kepada 0.77.' }, at: '2026-10-06T17:00:00+08:00', link: '/a/ai/quality', severity: 'info', roles: ['aiGovernanceLead', 'superAdmin', 'leadershipViewer'] },
]

// ---------------------------------------------------------------- Evidence monitor (last 14 days)

export const EVIDENCE_DAILY = (() => {
  const r = rng(1414)
  const days: { date: string; total: number; autoVerified: number; escalated: number; rejected: number; decisionHours: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(`${TODAY}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i)
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
    const total = Math.round((weekend ? 120 : 260) + r() * 60 + (i < 2 ? 40 : 0))
    const escRate = i < 2 ? 0.12 : 0.08 + r() * 0.02
    const escalated = Math.round(total * escRate)
    const rejected = Math.round(total * 0.03)
    days.push({ date: d.toISOString().slice(0, 10), total, autoVerified: total - escalated - rejected, escalated, rejected, decisionHours: Number((14 + r() * 10).toFixed(1)) })
  }
  return days
})()

export const EVIDENCE_BY_PORTAL = [
  { portal: 'KerjaKini', total: 1840, autoVerifiedPct: 0.9, escalatedPct: 0.07 },
  { portal: 'LaluanKerjaya', total: 1310, autoVerifiedPct: 0.86, escalatedPct: 0.1 },
  { portal: 'Company websites', total: 690, autoVerifiedPct: 0.74, escalatedPct: 0.19 },
  { portal: 'LinkedIn', total: 520, autoVerifiedPct: 0.81, escalatedPct: 0.13 },
  { portal: 'Walk-in / other', total: 210, autoVerifiedPct: 0.58, escalatedPct: 0.31 },
]

// ---------------------------------------------------------------- Audit log seed

export const AUDIT_SEED: AuditEntry[] = (() => {
  const r = rng(80)
  const acts: [string, string, string, string][] = [
    ['off-po', 'Verified evidence', 'evidence', 'Officer review'],
    ['off-po', 'Rejected evidence', 'evidence', 'Unreadable screenshot'],
    ['off-po', 'Approved partner role', 'partnerRole', 'Meets salary floor and contract criteria'],
    ['off-pm', 'Paused partner', 'partner', 'Two student reports pending'],
    ['off-pm', 'Added partner note', 'partner', 'Renewal call booked'],
    ['off-ai', 'Upheld skill dispute', 'dispute', 'Evidence supports level'],
    ['off-ai', 'Published rubric v2026.08', 'rubric', 'Second approver: off-sa'],
    ['off-cl', 'Granted tier override (14 days)', 'tierOverride', 'Bank receipt verified'],
    ['off-sa', 'Revealed student name', 'student', 'Support case SC-1182'],
    ['off-lm', 'Published course', 'course', 'Mapped to Advanced Excel'],
  ]
  return Array.from({ length: 40 }, (_, i) => {
    const [officerId, action, recordType, reason] = acts[i % acts.length]
    const day = workingDaysAgo(Math.floor(i / 6))
    return { id: `AU-${90000 - i}`, at: `${day}T${String(16 - (i % 8)).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}:00+08:00`, officerId, action, recordType, recordId: `${recordType.slice(0, 2).toUpperCase()}-${1000 + Math.floor(r() * 9000)}`, reason, where: 'Agency workspace · 10.12.4.21' }
  })
})()
