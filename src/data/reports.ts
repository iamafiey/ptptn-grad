import type { LocalizedText, OfficerRole } from '@/types/domain'

// Programme-level aggregates for the 7 reports and the cohort view (fictional, fixed seed).
// Counts are for the whole programme; report filters scale them deterministically.

export type ReportId = 'employment' | 'jobSearch' | 'repayment' | 'collections' | 'partnerHealth' | 'skillsLearning' | 'aiQuality' | 'operations'

export const REPORT_DEFS: { id: ReportId; audience: OfficerRole[]; cadence: 'weekly' | 'monthly' }[] = [
  { id: 'employment', audience: ['leadershipViewer', 'programmeOfficer'], cadence: 'monthly' },
  { id: 'jobSearch', audience: ['leadershipViewer', 'programmeOfficer'], cadence: 'monthly' },
  { id: 'repayment', audience: ['leadershipViewer', 'collectionLiaison'], cadence: 'monthly' },
  { id: 'collections', audience: ['leadershipViewer', 'collectionLiaison'], cadence: 'monthly' },
  { id: 'partnerHealth', audience: ['partnershipManager'], cadence: 'weekly' },
  { id: 'skillsLearning', audience: ['learningManager'], cadence: 'monthly' },
  { id: 'aiQuality', audience: ['aiGovernanceLead', 'leadershipViewer'], cadence: 'monthly' },
  { id: 'operations', audience: ['superAdmin'], cadence: 'weekly' },
]

/** Last 12 full months (Oct 2025 – Sep 2026). */
export const MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

export const MONTHLY = {
  placementsPartner: [38, 41, 35, 44, 52, 58, 63, 71, 76, 84, 92, 101],
  placementsPortal: [92, 96, 81, 104, 118, 126, 131, 140, 152, 161, 170, 178],
  placementsOther: [41, 39, 33, 42, 45, 47, 50, 49, 53, 55, 58, 60],
  activeSeekers: [9120, 9340, 9010, 9780, 10240, 10610, 10980, 11320, 11650, 11940, 12210, 12480],
  verifiedApps: [21400, 22900, 19800, 24600, 27300, 28900, 30100, 31800, 33200, 34900, 36100, 37800],
  tierAShare: [84.1, 84.4, 84.0, 84.9, 85.3, 85.8, 86.2, 86.9, 87.3, 87.8, 88.4, 88.9],
  recoveries: [141, 152, 138, 166, 179, 188, 201, 212, 238, 251, 274, 301],
  deferments: [610, 640, 588, 702, 744, 781, 806, 842, 870, 905, 931, 968],
  enrolments: [1120, 1180, 990, 1310, 1420, 1505, 1560, 1640, 1710, 1795, 1860, 1940],
  completions: [410, 446, 372, 498, 552, 590, 618, 655, 688, 731, 760, 802],
  levelGains: [190, 204, 171, 231, 256, 270, 287, 301, 316, 334, 349, 371],
  agreement: [94, 94, 95, 93, 94, 95, 94, 93, 93, 92, 91, 89],
  autoVerifyAccuracy: [97.1, 97.4, 97.0, 97.6, 97.8, 97.5, 97.9, 98.0, 97.7, 97.8, 97.6, 97.3],
  disputes: [180, 172, 160, 191, 204, 199, 210, 214, 220, 231, 236, 249],
  handled: [5210, 5480, 4930, 5920, 6340, 6610, 6880, 7120, 7390, 7660, 7940, 8210],
  onTime: [89.4, 89.6, 88.9, 89.2, 89.7, 90.1, 90.3, 90.6, 90.9, 91.1, 90.8, 91.4],
  promiseKept: [58, 59, 57, 60, 61, 62, 63, 63, 65, 66, 66, 68],
  slaHit: [93.2, 94.0, 92.1, 93.8, 94.4, 94.9, 95.1, 94.6, 95.3, 95.0, 94.2, 93.5],
}

export const PORTAL_SHARE: { portal: LocalizedText; share: number }[] = [
  { portal: { en: 'KerjaKini' }, share: 0.41 },
  { portal: { en: 'LaluanKerjaya' }, share: 0.27 },
  { portal: { en: 'MulaKerja (link-out)', ms: 'MulaKerja (pautan keluar)' }, share: 0.14 },
  { portal: { en: 'Talent Partner roles', ms: 'Peranan Rakan Bakat' }, share: 0.11 },
  { portal: { en: 'Other', ms: 'Lain-lain' }, share: 0.07 },
]

export const COHORT_BASE: Record<string, { size: number; visible: number; placed: number; medianDays: number; medianSalary: string }> = {
  '2023': { size: 21400, visible: 0.91, placed: 0.78, medianDays: 104, medianSalary: 'RM 3,000 – 3,499' },
  '2024': { size: 22900, visible: 0.93, placed: 0.71, medianDays: 96, medianSalary: 'RM 3,000 – 3,499' },
  '2025': { size: 24100, visible: 0.94, placed: 0.58, medianDays: 88, medianSalary: 'RM 2,500 – 2,999' },
  '2026': { size: 25300, visible: 0.72, placed: 0.21, medianDays: 61, medianSalary: 'RM 2,500 – 2,999' },
}

export const REPAYMENT_START: { group: LocalizedText; students: number; started: number; deferments: number }[] = [
  { group: { en: 'Placed via Talent Partner', ms: 'Ditempatkan melalui Rakan Bakat' }, students: 1840, started: 0.91, deferments: 22 },
  { group: { en: 'Placed via portal', ms: 'Ditempatkan melalui portal' }, students: 4210, started: 0.84, deferments: 96 },
  { group: { en: 'Placed, other', ms: 'Ditempatkan, lain-lain' }, students: 1730, started: 0.79, deferments: 61 },
  { group: { en: 'Still searching (meets threshold)', ms: 'Masih mencari (capai ambang)' }, students: 6120, started: 0.31, deferments: 2480 },
  { group: { en: 'Still searching (below threshold)', ms: 'Masih mencari (bawah ambang)' }, students: 3410, started: 0.18, deferments: 0 },
]

export const INSTITUTION_SHARE: Record<string, number> = { 'Public university': 0.7, 'Private university': 0.17, Polytechnic: 0.09, 'Community college': 0.04 }
export const STATE_SHARE: Record<string, number> = { Selangor: 0.22, Johor: 0.12, 'Pulau Pinang': 0.09, Perak: 0.08, Sabah: 0.07, Sarawak: 0.08, 'WP Kuala Lumpur': 0.1, Kelantan: 0.05 }

/** Cohort view: share of a graduation cohort in each state, by month since graduation. */
export const COHORT_CURVES: Record<string, { visible: number[]; hired: number[]; repaying: number[] }> = {
  '2025': {
    visible: [0.94, 0.86, 0.77, 0.69, 0.62, 0.55, 0.49, 0.45, 0.41, 0.38, 0.36, 0.34],
    hired: [0.04, 0.09, 0.13, 0.15, 0.14, 0.12, 0.1, 0.08, 0.07, 0.06, 0.05, 0.05],
    repaying: [0.0, 0.01, 0.04, 0.09, 0.15, 0.22, 0.28, 0.33, 0.37, 0.4, 0.43, 0.45],
  },
  '2024': {
    visible: [0.93, 0.85, 0.76, 0.67, 0.59, 0.52, 0.46, 0.41, 0.37, 0.34, 0.31, 0.29],
    hired: [0.05, 0.1, 0.14, 0.16, 0.15, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05],
    repaying: [0.0, 0.02, 0.05, 0.11, 0.18, 0.25, 0.31, 0.37, 0.41, 0.45, 0.49, 0.52],
  },
  '2023': {
    visible: [0.91, 0.84, 0.75, 0.66, 0.58, 0.5, 0.44, 0.39, 0.35, 0.31, 0.28, 0.26],
    hired: [0.05, 0.1, 0.14, 0.16, 0.15, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05],
    repaying: [0.0, 0.02, 0.06, 0.12, 0.19, 0.27, 0.34, 0.4, 0.45, 0.49, 0.53, 0.56],
  },
  '2026': {
    visible: [0.72, 0.68, 0.61],
    hired: [0.03, 0.07, 0.11],
    repaying: [0.0, 0.01, 0.03],
  },
}
