import type { AppNotification, EvidenceCheckResult, JobLogEntry, LocalizedText, RepaymentAccount } from '@/types/domain'
import { asset } from '@/lib/asset'

// Sample evidence files with known AI-check outcomes, so a presenter can trigger each result on cue.
export interface EvidenceSample {
  id: string
  label: LocalizedText
  description: LocalizedText
  fileName: string
  previewUrl: string
  /** What the simulated AI check returns for this file. */
  outcome: 'verified' | 'unreadable' | 'companyNotFound' | 'edited' | 'oldDate'
}

export const EVIDENCE_SAMPLES: EvidenceSample[] = [
  { id: 'smp-email', label: { en: 'Confirmation email', ms: 'E-mel pengesahan' }, description: { en: 'Clear, matches the application', ms: 'Jelas, sepadan dengan permohonan' }, fileName: 'application-received.png', previewUrl: asset('evidence/confirmation-email.svg'), outcome: 'verified' },
  { id: 'smp-blurry', label: { en: 'Blurry screenshot', ms: 'Tangkapan skrin kabur' }, description: { en: 'Too blurry to read', ms: 'Terlalu kabur untuk dibaca' }, fileName: 'screenshot-blur.jpg', previewUrl: asset('evidence/blurry-screenshot.svg'), outcome: 'unreadable' },
  { id: 'smp-unknown', label: { en: 'Unfamiliar company', ms: 'Syarikat tidak dikenali' }, description: { en: 'Company not in the registry', ms: 'Syarikat tiada dalam daftar' }, fileName: 'offer-email.png', previewUrl: asset('evidence/unknown-company.svg'), outcome: 'companyNotFound' },
  { id: 'smp-edited', label: { en: 'Edited screenshot', ms: 'Tangkapan skrin disunting' }, description: { en: 'Signs of image editing', ms: 'Tanda imej disunting' }, fileName: 'status-page.png', previewUrl: asset('evidence/edited-screenshot.svg'), outcome: 'edited' },
  { id: 'smp-old', label: { en: 'Old email', ms: 'E-mel lama' }, description: { en: 'Dated outside this period', ms: 'Bertarikh di luar tempoh ini' }, fileName: 'email-2025.png', previewUrl: asset('evidence/old-email.svg'), outcome: 'oldDate' },
  { id: 'smp-interview', label: { en: 'Interview invite', ms: 'Jemputan temu duga' }, description: { en: 'Clear interview invitation', ms: 'Jemputan temu duga yang jelas' }, fileName: 'interview-invite.png', previewUrl: asset('evidence/interview-invite.svg'), outcome: 'verified' },
]

const ok = 'pass' as const
const check = (
  id: string,
  confidence: number,
  decision: EvidenceCheckResult['decision'],
  extracted: EvidenceCheckResult['extracted'],
  over: Partial<EvidenceCheckResult['checks']> = {},
  reasons: LocalizedText[] = [],
): EvidenceCheckResult => ({
  checkId: id,
  modelVersion: 'evidencecheck-0.9 (on-prem)',
  checkedAt: `${extracted.date ?? '2026-10-01'}T12:00:00+08:00`,
  confidence,
  extracted,
  checks: { readable: ok, companyExists: ok, matchesEntry: ok, dateInPeriod: ok, duplicateImage: ok, editedImage: ok, ...over },
  decision,
  reasons,
})

export const JOB_LOG_SEED: Record<string, JobLogEntry[]> = {
  hafiz: [
    { id: 'log-h1', studentId: 'hafiz', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'Supply Chain Analyst', company: 'Teras Niaga Distribution', appliedAt: '2026-10-02', evidenceId: 'ev-h1', status: 'verified', outcome: 'interview', check: check('chk-h1', 0.94, 'autoVerified', { company: 'Teras Niaga Distribution', role: 'Supply Chain Analyst', portal: 'KerjaKini', date: '2026-10-02' }) },
    { id: 'log-h2', studentId: 'hafiz', source: 'portalFeed', portalId: 'laluankerjaya', portalName: 'LaluanKerjaya', role: 'Logistics Coordinator', company: 'Pantas Express Sdn Bhd', appliedAt: '2026-10-01', evidenceId: 'ev-h2', status: 'verified', outcome: 'applied', check: check('chk-h2', 0.91, 'autoVerified', { company: 'Pantas Express Sdn Bhd', role: 'Logistics Coordinator', portal: 'LaluanKerjaya', date: '2026-10-01' }) },
    { id: 'log-h3', studentId: 'hafiz', source: 'portalOther', portalName: 'Company website', role: 'Graduate Planner', company: 'Syarikat Cahaya Timur Logistik', appliedAt: '2026-10-03', evidenceId: 'ev-h3', status: 'underReview', outcome: 'applied', check: check('chk-h3', 0.62, 'escalated', { company: 'Syarikat Cahaya Timur Logistik', role: 'Graduate Planner', portal: 'Company website', date: '2026-10-03' }, { companyExists: 'warn' }, [{ en: 'We couldn’t find this company in the business registry. An officer will check it.', ms: 'Kami tidak menjumpai syarikat ini dalam daftar perniagaan. Pegawai akan menyemaknya.' }]) },
    { id: 'log-h4', studentId: 'hafiz', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'Warehouse Executive', company: 'Gudang Prima Sdn Bhd', appliedAt: '2026-10-04', evidenceId: 'ev-h4', status: 'rejected', outcome: 'applied', check: check('chk-h4', 0.31, 'rejected', { portal: 'KerjaKini' }, { readable: 'fail', matchesEntry: 'warn' }, [{ en: 'We couldn’t read your screenshot. Please re-upload a clearer one.', ms: 'Kami tidak dapat membaca tangkapan skrin anda. Sila muat naik yang lebih jelas.' }]), rejectionReason: { en: 'We couldn’t read your screenshot. Please re-upload a clearer one.', ms: 'Kami tidak dapat membaca tangkapan skrin anda. Sila muat naik yang lebih jelas.' } },
    { id: 'log-h5', studentId: 'hafiz', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'Transport Planner', company: 'Laju Haulage Sdn Bhd', appliedAt: '2026-10-05', evidenceId: 'ev-h5', status: 'verified', outcome: 'applied', check: check('chk-h5', 0.92, 'autoVerified', { company: 'Laju Haulage Sdn Bhd', role: 'Transport Planner', portal: 'KerjaKini', date: '2026-10-05' }) },
    { id: 'log-h6', studentId: 'hafiz', source: 'portalFeed', portalId: 'laluankerjaya', portalName: 'LaluanKerjaya', role: 'Inventory Analyst', company: 'Kedai Rakyat Holdings', appliedAt: '2026-09-18', evidenceId: 'ev-h6', status: 'verified', outcome: 'closed', check: check('chk-h6', 0.9, 'autoVerified', { company: 'Kedai Rakyat Holdings', role: 'Inventory Analyst', portal: 'LaluanKerjaya', date: '2026-09-18' }) },
    { id: 'log-h7', studentId: 'hafiz', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'Purchasing Executive', company: 'Bina Jaya Materials', appliedAt: '2026-09-10', evidenceId: 'ev-h7', status: 'verified', outcome: 'closed', check: check('chk-h7', 0.95, 'autoVerified', { company: 'Bina Jaya Materials', role: 'Purchasing Executive', portal: 'KerjaKini', date: '2026-09-10' }) },
  ],
  kavitha: [
    { id: 'log-k1', studentId: 'kavitha', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'Electrical Engineer', company: 'Arus Murni Engineering', appliedAt: '2026-10-01', evidenceId: 'ev-k1', status: 'verified', outcome: 'interview', check: check('chk-k1', 0.93, 'autoVerified', { company: 'Arus Murni Engineering', role: 'Electrical Engineer', portal: 'KerjaKini', date: '2026-10-01' }) },
    { id: 'log-k2', studentId: 'kavitha', source: 'portalFeed', portalId: 'laluankerjaya', portalName: 'LaluanKerjaya', role: 'Renewable Energy Technician', company: 'Matahari Hijau Sdn Bhd', appliedAt: '2026-10-03', evidenceId: 'ev-k2', status: 'verified', outcome: 'applied', check: check('chk-k2', 0.9, 'autoVerified', { company: 'Matahari Hijau Sdn Bhd', role: 'Renewable Energy Technician', portal: 'LaluanKerjaya', date: '2026-10-03' }) },
    { id: 'log-k3', studentId: 'kavitha', source: 'portalOther', portalName: 'LinkedIn', role: 'Junior Electrical Designer', company: 'Rekabina Elektrik', appliedAt: '2026-10-05', evidenceId: 'ev-k3', status: 'underReview', outcome: 'applied', check: check('chk-k3', 0.58, 'escalated', { company: 'Rekabina Elektrik', role: 'Junior Electrical Designer', date: '2026-10-05' }, { editedImage: 'warn' }, [{ en: 'Parts of this image may have been edited. An officer will check it.', ms: 'Sebahagian imej ini mungkin telah disunting. Pegawai akan menyemaknya.' }]) },
    { id: 'log-k4', studentId: 'kavitha', source: 'portalFeed', portalId: 'kerjakini', portalName: 'KerjaKini', role: 'QA/QC Engineer', company: 'Presisi Components Sdn Bhd', appliedAt: '2026-09-22', evidenceId: 'ev-k4', status: 'verified', outcome: 'closed', check: check('chk-k4', 0.92, 'autoVerified', { company: 'Presisi Components Sdn Bhd', role: 'QA/QC Engineer', portal: 'KerjaKini', date: '2026-09-22' }) },
    { id: 'log-k5', studentId: 'kavitha', source: 'portalFeed', portalId: 'laluankerjaya', portalName: 'LaluanKerjaya', role: 'Maintenance Engineer', company: 'Kilang Besi Utara', appliedAt: '2026-09-15', evidenceId: 'ev-k5', status: 'verified', outcome: 'closed', check: check('chk-k5', 0.91, 'autoVerified', { company: 'Kilang Besi Utara', role: 'Maintenance Engineer', portal: 'LaluanKerjaya', date: '2026-09-15' }) },
  ],
  nurul: [],
}

/** Evidence previews for seeded log entries (id → image). */
export const LOG_EVIDENCE_PREVIEW: Record<string, string> = {
  'ev-h1': asset('evidence/interview-invite.svg'),
  'ev-h2': asset('evidence/confirmation-email.svg'),
  'ev-h3': asset('evidence/unknown-company.svg'),
  'ev-h4': asset('evidence/blurry-screenshot.svg'),
  'ev-h5': asset('evidence/portal-screenshot.svg'),
  'ev-h6': asset('evidence/portal-screenshot.svg'),
  'ev-h7': asset('evidence/confirmation-email.svg'),
  'ev-k1': asset('evidence/interview-invite.svg'),
  'ev-k2': asset('evidence/portal-screenshot.svg'),
  'ev-k3': asset('evidence/edited-screenshot.svg'),
  'ev-k4': asset('evidence/confirmation-email.svg'),
  'ev-k5': asset('evidence/portal-screenshot.svg'),
}

// Repayment accounts: student-only; never passed to job or employer surfaces.
export const REPAYMENT_SEED: Record<string, RepaymentAccount> = {
  nurul: { studentId: 'nurul', status: 'grace', graceEndsAt: '2027-07-01', missedCount: 0, payments: [] },
  hafiz: { studentId: 'hafiz', status: 'grace', graceEndsAt: '2026-12-31', missedCount: 0, payments: [] },
  kavitha: {
    studentId: 'kavitha',
    status: 'behind',
    nextPayment: { dueAt: '2026-10-15', amountRM: 180 },
    method: 'manual',
    missedCount: 1,
    payments: [
      { at: '2026-04-15', amountRM: 180, status: 'paid' },
      { at: '2026-05-15', amountRM: 180, status: 'paid' },
      { at: '2026-06-15', amountRM: 180, status: 'paid' },
      { at: '2026-07-15', amountRM: 180, status: 'paid' },
      { at: '2026-08-15', amountRM: 180, status: 'missed' },
      { at: '2026-09-15', amountRM: 180, status: 'paid' },
    ],
  },
}

export const NOTIFICATIONS_SEED: AppNotification[] = [
  { id: 'n-h1', studentId: 'hafiz', type: 'invitation', channel: ['push', 'sms'], body: { en: 'A Talent Partner wants to talk to you about a Logistics Executive role.', ms: 'Rakan Bakat ingin berbincang dengan anda tentang peranan Eksekutif Logistik.' }, at: '2026-10-05T10:12:00+08:00', read: false, link: '/s/opportunities?tab=partner' },
  { id: 'n-h2', studentId: 'hafiz', type: 'invitationExpiring', channel: ['push'], body: { en: 'Your invitation from a Talent Partner expires in 2 days.', ms: 'Jemputan daripada Rakan Bakat tamat dalam 2 hari.' }, at: '2026-10-07T08:00:00+08:00', read: false, link: '/s/opportunities?tab=partner' },
  { id: 'n-h3', studentId: 'hafiz', type: 'evidence', channel: ['inApp', 'push'], body: { en: 'We couldn’t read your screenshot. Please re-upload.', ms: 'Kami tidak dapat membaca tangkapan skrin anda. Sila muat naik semula.' }, at: '2026-10-04T15:30:00+08:00', read: false, link: '/s/opportunities?tab=log' },
  { id: 'n-h4', studentId: 'hafiz', type: 'evidence', channel: ['inApp'], body: { en: 'Your application to Laju Haulage is verified.', ms: 'Permohonan anda ke Laju Haulage telah disahkan.' }, at: '2026-10-05T16:02:00+08:00', read: true, link: '/s/opportunities?tab=log' },
  { id: 'n-h5', studentId: 'hafiz', type: 'newMatches', channel: ['digest'], body: { en: '5 new roles match 80%+ of your skills this week.', ms: '5 peranan baharu sepadan 80%+ kemahiran anda minggu ini.' }, at: '2026-10-06T09:00:00+08:00', read: true, link: '/s/opportunities?tab=open' },
  { id: 'n-h6', studentId: 'hafiz', type: 'rescored', channel: ['inApp'], body: { en: 'Advanced Excel moved to Advanced.', ms: 'Excel lanjutan naik ke tahap Lanjutan.' }, at: '2026-09-20T11:00:00+08:00', read: true, link: '/s/profile' },
  { id: 'n-k1', studentId: 'kavitha', type: 'benefits', channel: ['push'], body: { en: '3 benefits are paused. Here’s how to get them back.', ms: '3 manfaat digantung. Ini cara untuk mendapatkannya semula.' }, at: '2026-08-20T09:00:00+08:00', read: false, link: '/s/repayment' },
  { id: 'n-k2', studentId: 'kavitha', type: 'paymentDue', channel: ['push'], body: { en: 'Your payment is due on the 15th. Stay in good standing.', ms: 'Bayaran anda perlu dijelaskan pada 15hb. Kekal dalam kedudukan baik.' }, at: '2026-10-08T09:00:00+08:00', read: false, link: '/s/repayment' },
  { id: 'n-k3', studentId: 'kavitha', type: 'interview', channel: ['push', 'email'], body: { en: 'Interview confirmed: Thu 10am, video call.', ms: 'Temu duga disahkan: Khamis 10 pagi, panggilan video.' }, at: '2026-10-04T14:00:00+08:00', read: true, link: '/s/opportunities?tab=log' },
  { id: 'n-k4', studentId: 'kavitha', type: 'threshold', channel: ['push'], body: { en: '2 more verified applications this month keep your job-seeking record active.', ms: '2 lagi permohonan disahkan bulan ini mengekalkan rekod mencari kerja anda.' }, at: '2026-10-06T09:00:00+08:00', read: false, link: '/s/opportunities?tab=log' },
  { id: 'n-n1', studentId: 'nurul', type: 'newMatches', channel: ['inApp'], body: { en: 'Finish your profile so Talent Partners can find you.', ms: 'Lengkapkan profil anda supaya Rakan Bakat boleh mencari anda.' }, at: '2026-10-05T09:00:00+08:00', read: false, link: '/s/onboarding/activities' },
]
