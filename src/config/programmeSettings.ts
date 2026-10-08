// Every "open decision" in the specs, as a typed setting seeded with the spec's example value.
// Edited live (in memory) from Agency → Settings → Programme settings and Repayment tiers.
// See BUILD_PLAN.md §3.

import type { QueueId } from '@/types/domain'

export type TierBPartnerRoles = 'hidden' | 'earlyAccessWindow'
export type TierBCourses = 'freePlusPreviews' | 'freeOnly'
export type UniversitySource = 'uploadOnly' | 'integration'
export type TaxonomySource = 'own' | 'alignedNational'
export type PortalMode = 'feed' | 'linkOut'
export type ContactChannel = 'inApp' | 'sms' | 'email' | 'whatsapp'

export interface ProgrammeSettings {
  tierB: { partnerRoles: TierBPartnerRoles; earlyAccessDays: number; courses: TierBCourses }
  tier: {
    graceCountsAsTierA: boolean
    missedPaymentsForTierB: number
    restructuredCountsAsTierA: boolean
    restoreOn: 'syncConfirmed'
    overrideDays: number
  }
  jobSeeking: { monthlyThreshold: number; supportsDeferment: boolean }
  evidence: { autoVerifyConfidence: number; acceptedTypes: string[]; applicationPeriodDays: number }
  partners: { salaryFloorRM: number; allowedContractTypes: ('permanent' | 'graduateProgramme' | 'contract')[]; probationDays: number }
  placements: { triggerRepaymentSetup: boolean }
  records: { universitySource: UniversitySource }
  taxonomy: { source: TaxonomySource }
  portals: Record<string, PortalMode>
  sla: Record<QueueId, number>
  roles: { merged: string[][] }
  retention: { profileMonths: number; evidenceMonths: number; auditMonths: number }
  ai: { lowConfidenceThreshold: number; agreementAlertThreshold: number }
  /** Collections: early-warning thresholds and contact rules (docs/collections-flow.md). */
  collections: {
    watchThreshold: number
    highThreshold: number
    contactCapPerWeek: number
    quietHours: { start: number; end: number }
    channels: ContactChannel[]
    dpdBuckets: [number, number, number]
    agentsSeeAmounts: boolean
    planApproval: 'twoPerson' | 'single'
  }
  student: { visibilityStartsFinalSemester: boolean }
}

export const DEFAULT_SETTINGS: ProgrammeSettings = {
  tierB: { partnerRoles: 'earlyAccessWindow', earlyAccessDays: 14, courses: 'freePlusPreviews' },
  tier: { graceCountsAsTierA: true, missedPaymentsForTierB: 1, restructuredCountsAsTierA: true, restoreOn: 'syncConfirmed', overrideDays: 14 },
  jobSeeking: { monthlyThreshold: 4, supportsDeferment: true },
  evidence: {
    autoVerifyConfidence: 0.85,
    acceptedTypes: ['confirmationEmail', 'screenshot', 'interviewInvite', 'offerLetter'],
    applicationPeriodDays: 90,
  },
  partners: { salaryFloorRM: 3000, allowedContractTypes: ['permanent', 'graduateProgramme'], probationDays: 60 },
  placements: { triggerRepaymentSetup: false },
  records: { universitySource: 'uploadOnly' },
  taxonomy: { source: 'own' },
  portals: { kerjakini: 'feed', laluankerjaya: 'feed', mulakerja: 'linkOut' },
  sla: {
    evidence: 3,
    placements: 5,
    partnerRoleApprovals: 2,
    partnerApplications: 0, // same day for reports
    portalFeedIssues: 1,
    skillDisputes: 5,
    lowConfidence: 5,
    tierOverrides: 1,
    courseSubmissions: 5,
    earlyWarning: 2,
    serviceDesk: 1,
  },
  roles: { merged: [] },
  retention: { profileMonths: 24, evidenceMonths: 60, auditMonths: 84 },
  ai: { lowConfidenceThreshold: 0.6, agreementAlertThreshold: 90 },
  collections: {
    watchThreshold: 40,
    highThreshold: 70,
    contactCapPerWeek: 3,
    quietHours: { start: 9, end: 20 },
    channels: ['inApp', 'sms', 'email'],
    dpdBuckets: [30, 60, 90],
    agentsSeeAmounts: true,
    planApproval: 'twoPerson',
  },
  student: { visibilityStartsFinalSemester: true },
}
