import type { AccountFlag, LocalizedText, MalaysianState, SkillLevel } from '@/types/domain'

// Phase 6 seed data: student directory, flags, AI quality and fairness, tiers, matching.
// Deterministic (fixed seed). All names, ICs and figures are fictional.

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

// ---------------------------------------------------------------- Student directory (synthetic)

export type Stage = 'onboarding' | 'visible' | 'talking' | 'offer' | 'hired'

export interface DirectoryStudent {
  id: string
  code: string
  name: string
  icMasked: string
  institution: string
  institutionType: 'Public university' | 'Private university' | 'Polytechnic' | 'Community college'
  programme: string
  graduationYear: number
  state: MalaysianState
  cohort: string
  profileStrength: number
  visible: boolean
  skillsCount: number
  invitations: number
  jobSearchEntries: number
  stage: Stage
  lastActive: string
  tier: 'A' | 'B'
  topSkills: { skillId: string; level: SkillLevel }[]
  demo?: boolean
}

const FIRST = ['Ahmad', 'Siti', 'Nur', 'Muhammad', 'Aisyah', 'Lim', 'Tan', 'Wong', 'Priya', 'Arjun', 'Farah', 'Hakim', 'Mei Ling', 'Ravi', 'Zulaikha', 'Danial', 'Chloe', 'Iman', 'Kumar', 'Sharifah']
const LAST = ['binti Abdullah', 'bin Ismail', 'binti Hassan', 'bin Yusof', 'Wei Jie', 'Kah Hoe', 'a/p Rajan', 'a/l Muthu', 'binti Razak', 'bin Osman', 'Siew Lan', 'Jun Hao']
const INST: [string, DirectoryStudent['institutionType']][] = [
  ['UiTM Shah Alam', 'Public university'], ['UKM', 'Public university'], ['UPM', 'Public university'], ['USM', 'Public university'], ['UTM', 'Public university'], ['UUM', 'Public university'],
  ['UMS', 'Public university'], ['UNIMAS', 'Public university'], ['UTHM', 'Public university'], ['Universiti Teknologi Petronas', 'Private university'], ['Multimedia University', 'Private university'],
  ['Taylor’s University', 'Private university'], ['Politeknik Ungku Omar', 'Polytechnic'], ['Politeknik Kuching', 'Polytechnic'], ['Kolej Komuniti Selayang', 'Community college'],
]
const PROGRAMMES: [string, string[]][] = [
  ['BBA Marketing', ['digital-marketing', 'social-media', 'market-research', 'sales']],
  ['BSc Logistics', ['logistics-coordination', 'inventory-management', 'spreadsheet-modelling']],
  ['BEng Electrical', ['engineering-design', 'technical-problem-solving', 'lab-testing']],
  ['BSc Computer Science', ['programming-python', 'web-development', 'sql-databases']],
  ['BAcc Accounting', ['budgeting', 'financial-analysis', 'spreadsheet-modelling']],
  ['Diploma Mechanical Engineering', ['technical-problem-solving', 'health-safety', 'quality-control']],
  ['BA Communication', ['public-speaking', 'report-writing', 'social-media']],
  ['Diploma Business Studies', ['customer-service', 'sales', 'budgeting']],
]
const STATES: MalaysianState[] = ['Selangor', 'Johor', 'Pulau Pinang', 'Perak', 'Sabah', 'Sarawak', 'Kedah', 'Kelantan', 'Pahang', 'WP Kuala Lumpur', 'Negeri Sembilan', 'Melaka', 'Terengganu']
const STAGES: Stage[] = ['onboarding', 'visible', 'visible', 'visible', 'talking', 'talking', 'offer', 'hired']
const LEVELS: SkillLevel[] = ['foundation', 'working', 'working', 'advanced']

export const DIRECTORY: DirectoryStudent[] = (() => {
  const r = rng(6060)
  return Array.from({ length: 60 }, (_, i) => {
    const [institution, institutionType] = pick(r, INST)
    const [programme, skills] = pick(r, PROGRAMMES)
    const grad = pick(r, [2024, 2025, 2025, 2026, 2026, 2026])
    const stage = pick(r, STAGES)
    const lastDays = i % 9 === 0 ? 61 + Math.floor(r() * 40) : Math.floor(r() * 30)
    const last = new Date('2026-10-07T00:00:00Z')
    last.setUTCDate(last.getUTCDate() - lastDays)
    const ic = `${String(grad - 2004).padStart(2, '0')}${String(1 + Math.floor(r() * 12)).padStart(2, '0')}xx-xx-${String(1000 + Math.floor(r() * 8999))}`
    return {
      id: `stu-${i + 1}`,
      code: `S-${21000 + i * 113}`,
      name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      icMasked: ic,
      institution,
      institutionType,
      programme,
      graduationYear: grad,
      state: pick(r, STATES),
      cohort: String(grad),
      profileStrength: stage === 'onboarding' ? 20 + Math.floor(r() * 30) : 55 + Math.floor(r() * 45),
      visible: stage !== 'onboarding' && r() > 0.08,
      skillsCount: stage === 'onboarding' ? 0 : 6 + Math.floor(r() * 10),
      invitations: stage === 'talking' || stage === 'offer' ? 1 + Math.floor(r() * 3) : 0,
      jobSearchEntries: Math.floor(r() * 14),
      stage,
      lastActive: last.toISOString().slice(0, 10),
      tier: r() > 0.2 ? 'A' : 'B',
      topSkills: skills.map((skillId) => ({ skillId, level: pick(r, LEVELS) })),
    }
  })
})()

export const FLAGS_SEED: AccountFlag[] = [
  { id: 'FL-1001', studentId: 'S-21339', kind: 'duplicateIC', detail: 'Two accounts share IC ending 4471 (UiTM Shah Alam, Politeknik Ungku Omar).', raisedAt: '2026-10-05' },
  { id: 'FL-1002', studentId: 'S-22356', kind: 'reusedEvidence', detail: 'Same confirmation screenshot submitted by 3 students this week.', raisedAt: '2026-10-06' },
  { id: 'FL-1003', studentId: 'S-24051', kind: 'scoreJump', detail: 'Data analysis jumped Foundation → Advanced after one upload.', raisedAt: '2026-10-04' },
  { id: 'FL-1004', studentId: 'S-23880', kind: 'partnerReport', detail: 'Partner reported a no-show at two scheduled interviews.', raisedAt: '2026-10-02' },
]

// ---------------------------------------------------------------- Skill disputes (synthetic detail)

export interface DisputeCase {
  id: string
  studentCode: string
  skillId: string
  level: SkillLevel
  claimed: SkillLevel
  reason: 'level' | 'notMine' | 'evidence'
  comment: string
  aiRationale: string
  evidence: string[]
  openedAt: string
  status: 'open' | 'upheld' | 'corrected' | 'evidenceRequested'
  taxonomyIssue?: boolean
}

export const DISPUTES_SEED: DisputeCase[] = [
  { id: 'SD-2401', studentCode: 'S-24000', skillId: 'team-leadership', level: 'working', claimed: 'advanced', reason: 'level', comment: 'I led the society for 14 months, not 6. The AI read my start date wrong.', aiRationale: 'Led a 12-person committee for 6 months.', evidence: ['Activity: President, Persatuan Mahasiswa Sabah', 'Letter: advisor confirmation (Jan 2025 – Mar 2026)'], openedAt: '2026-10-01', status: 'open' },
  { id: 'SD-2402', studentCode: 'S-24211', skillId: 'data-analysis', level: 'working', claimed: 'foundation', reason: 'notMine', comment: 'This was a group project. I did the presentation, not the analysis.', aiRationale: 'Analysed survey data for the final-year project (grade A-).', evidence: ['FYP: Customer satisfaction at a Penang hotel'], openedAt: '2026-10-02', status: 'open' },
  { id: 'SD-2403', studentCode: 'S-24422', skillId: 'event-management', level: 'foundation', claimed: 'working', reason: 'evidence', comment: 'Certificate attached later; please re-check.', aiRationale: 'Committee member for a 1-day event.', evidence: ['Activity: Committee, Karnival Sukan UMS', 'Certificate (added 3 Oct)'], openedAt: '2026-10-05', status: 'open' },
  { id: 'SD-2404', studentCode: 'S-24633', skillId: 'customer-service', level: 'foundation', claimed: 'working', reason: 'level', comment: 'I worked at the counter for 2 years during my diploma.', aiRationale: 'Part-time retail assistant, 4 months.', evidence: ['Activity: Retail assistant, Kedai Runcit Pak Mat'], openedAt: '2026-09-30', status: 'open' },
  { id: 'SD-2405', studentCode: 'S-24844', skillId: 'programming-python', level: 'working', claimed: 'foundation', reason: 'notMine', comment: 'I used Python once in a lab. I’m not confident at Working.', aiRationale: 'Wrote Python scripts for a robotics club.', evidence: ['Activity: Member, Robotics Club UTM'], openedAt: '2026-10-06', status: 'open' },
  { id: 'SD-2406', studentCode: 'S-25055', skillId: 'budgeting', level: 'foundation', claimed: 'working', reason: 'evidence', comment: 'I was treasurer for the whole year, see the letter.', aiRationale: 'Treasurer, 3 months.', evidence: ['Activity: Treasurer, Kelab Rekreasi', 'Letter (added 4 Oct)'], openedAt: '2026-10-04', status: 'open' },
  { id: 'SD-2407', studentCode: 'S-25266', skillId: 'public-speaking', level: 'working', claimed: 'advanced', reason: 'level', comment: 'I won the state debate championship twice.', aiRationale: 'Debate team member, 1 year.', evidence: ['Competition: Piala Debat Negeri 2024, 2025'], openedAt: '2026-10-07', status: 'open' },
  { id: 'SD-2408', studentCode: 'S-25477', skillId: 'market-research', level: 'working', claimed: 'foundation', reason: 'notMine', comment: 'The survey was done by my supervisor; I only entered data.', aiRationale: 'Ran a survey of 200 respondents for FYP.', evidence: ['FYP: Consumer trust in e-wallets'], openedAt: '2026-10-02', status: 'open' },
]

// ---------------------------------------------------------------- AI quality & fairness

export const AGREEMENT_WEEKLY = [
  { week: 'W34', agreement: 94 }, { week: 'W35', agreement: 93 }, { week: 'W36', agreement: 95 }, { week: 'W37', agreement: 92 },
  { week: 'W38', agreement: 93 }, { week: 'W39', agreement: 91 }, { week: 'W40', agreement: 89 }, { week: 'W41', agreement: 88 },
]

export interface SampleReview {
  id: string
  studentCode: string
  skillId: string
  aiLevel: SkillLevel
  source: string
  verdict?: 'agree' | 'disagree'
}

export const SAMPLE_REVIEWS: SampleReview[] = [
  { id: 'QR-1', studentCode: 'S-25097', skillId: 'customer-service', aiLevel: 'working', source: 'Part-time cashier, 10 months, 120 customers a shift' },
  { id: 'QR-2', studentCode: 'S-25194', skillId: 'project-management', aiLevel: 'advanced', source: 'FYP lead, 5 months, team of 3' },
  { id: 'QR-3', studentCode: 'S-25291', skillId: 'social-media', aiLevel: 'working', source: 'Ran a bakery Instagram for 8 months, 1,200 followers' },
  { id: 'QR-4', studentCode: 'S-25388', skillId: 'logistics-coordination', aiLevel: 'foundation', source: 'Helped pack donations for one weekend' },
  { id: 'QR-5', studentCode: 'S-25485', skillId: 'lab-testing', aiLevel: 'advanced', source: 'Lab demonstrator 18 months, verified letter' },
]

export interface FairnessRow {
  group: string
  students: number
  avgSkills: number
  advancedShare: number
  avgConfidence: number
  disputeRate: number
}

export const FAIRNESS_INSTITUTION: FairnessRow[] = [
  { group: 'Public university', students: 12840, avgSkills: 11.2, advancedShare: 0.18, avgConfidence: 0.82, disputeRate: 0.011 },
  { group: 'Private university', students: 3120, avgSkills: 11.6, advancedShare: 0.2, avgConfidence: 0.83, disputeRate: 0.009 },
  { group: 'Polytechnic', students: 1710, avgSkills: 9.1, advancedShare: 0.12, avgConfidence: 0.77, disputeRate: 0.019 },
  { group: 'Community college', students: 750, avgSkills: 8.4, advancedShare: 0.1, avgConfidence: 0.74, disputeRate: 0.022 },
]

export const FAIRNESS_STATE: FairnessRow[] = [
  { group: 'Selangor', students: 4120, avgSkills: 11.4, advancedShare: 0.19, avgConfidence: 0.83, disputeRate: 0.01 },
  { group: 'Johor', students: 2280, avgSkills: 10.9, advancedShare: 0.17, avgConfidence: 0.81, disputeRate: 0.012 },
  { group: 'Sabah', students: 1340, avgSkills: 9.6, advancedShare: 0.13, avgConfidence: 0.78, disputeRate: 0.017 },
  { group: 'Sarawak', students: 1410, avgSkills: 9.9, advancedShare: 0.14, avgConfidence: 0.79, disputeRate: 0.015 },
  { group: 'Kelantan', students: 980, avgSkills: 9.4, advancedShare: 0.13, avgConfidence: 0.78, disputeRate: 0.016 },
  { group: 'Pulau Pinang', students: 1650, avgSkills: 11.1, advancedShare: 0.18, avgConfidence: 0.82, disputeRate: 0.01 },
]

// ---------------------------------------------------------------- Tiers

export interface SyncRun {
  at: string
  records: number
  errors: number
  state: 'ok' | 'failed'
  note?: string
}

export const SYNC_HISTORY: SyncRun[] = [
  { at: '2026-10-07T02:00:00+08:00', records: 0, errors: 1, state: 'failed', note: 'Timeout from repayment system; retrying hourly' },
  { at: '2026-10-06T02:00:00+08:00', records: 18233, errors: 0, state: 'ok' },
  { at: '2026-10-05T02:00:00+08:00', records: 18190, errors: 2, state: 'ok' },
  { at: '2026-10-04T02:00:00+08:00', records: 18144, errors: 0, state: 'ok' },
  { at: '2026-10-03T02:00:00+08:00', records: 18102, errors: 0, state: 'ok' },
  { at: '2026-10-02T02:00:00+08:00', records: 18077, errors: 0, state: 'ok' },
  { at: '2026-10-01T02:00:00+08:00', records: 18031, errors: 1, state: 'ok' },
]

export const TIER_BY_COHORT = [
  { cohort: '2023', tierA: 74, tierB: 26 },
  { cohort: '2024', tierA: 78, tierB: 22 },
  { cohort: '2025', tierA: 84, tierB: 16 },
  { cohort: '2026', tierA: 93, tierB: 7 },
]

export const RECOVERIES_MONTHLY = [
  { month: 'May', recoveries: 212 }, { month: 'Jun', recoveries: 238 }, { month: 'Jul', recoveries: 251 },
  { month: 'Aug', recoveries: 274 }, { month: 'Sep', recoveries: 301 }, { month: 'Oct', recoveries: 96 },
]

export interface OverrideRequest {
  id: string
  studentCode: string
  /** Real demo student id, when it belongs to one. */
  studentId?: string
  proof: string
  note: string
  requestedAt: string
  status: 'pending' | 'active' | 'expired' | 'rejected'
  expiresAt?: string
}

export const OVERRIDES_SEED: OverrideRequest[] = [
  { id: 'OV-5101', studentCode: 'S-24087', studentId: 'kavitha', proof: 'Bank receipt, 6 Oct 2026, ref 88213409', note: 'Paid the missed August instalment; not yet synced.', requestedAt: '2026-10-06', status: 'pending' },
  { id: 'OV-5102', studentCode: 'S-26173', proof: 'Salary slip showing PTPTN deduction', note: 'Employer started deduction in September.', requestedAt: '2026-10-05', status: 'pending' },
  { id: 'OV-5103', studentCode: 'S-26346', proof: 'Online banking screenshot', note: 'Paid on 30 Sep.', requestedAt: '2026-10-07', status: 'pending' },
  { id: 'OV-5090', studentCode: 'S-25811', proof: 'Bank receipt', note: 'Granted 14 days pending sync.', requestedAt: '2026-09-28', status: 'active', expiresAt: '2026-10-12' },
  { id: 'OV-5071', studentCode: 'S-25502', proof: 'Bank receipt', note: 'Auto-expired: sync confirmed payment.', requestedAt: '2026-09-10', status: 'expired', expiresAt: '2026-09-24' },
]

// ---------------------------------------------------------------- Matching monitor

export const MATCHING_BY_PARTNER: Record<string, { views: number; invitations: number; acceptances: number; hires: number }> = {
  'seri-mutiara': { views: 1840, invitations: 142, acceptances: 87, hires: 11 },
  'awan-tek': { views: 2610, invitations: 210, acceptances: 116, hires: 14 },
  'cahaya-tenaga': { views: 910, invitations: 64, acceptances: 31, hires: 4 },
  'permata-health': { views: 720, invitations: 58, acceptances: 37, hires: 6 },
  'rimba-agro': { views: 1205, invitations: 97, acceptances: 56, hires: 8 },
  'lestari-bina': { views: 430, invitations: 31, acceptances: 13, hires: 2 },
  'selat-capital': { views: 990, invitations: 77, acceptances: 51, hires: 5 },
  'dian-retail': { views: 380, invitations: 40, acceptances: 12, hires: 1 },
  'kestrel-aero': { views: 160, invitations: 12, acceptances: 6, hires: 0 },
  'merdu-telekom': { views: 0, invitations: 0, acceptances: 0, hires: 0 },
}

export const UNSEEN_SUMMARY: { total: number; byInstitutionType: { group: string; count: number }[]; note: LocalizedText } = {
  total: 1186,
  byInstitutionType: [
    { group: 'Public university', count: 512 },
    { group: 'Private university', count: 138 },
    { group: 'Polytechnic', count: 361 },
    { group: 'Community college', count: 175 },
  ],
  note: { en: 'Visible students with no partner profile views in 60 days. Polytechnic and community college graduates are over-represented.', ms: 'Pelajar boleh dilihat tanpa tontonan rakan kongsi dalam 60 hari.' },
}
