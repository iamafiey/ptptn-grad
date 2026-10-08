import type { Invitation, PartnerRole, TalentPartner } from '@/types/domain'

// Talent Partners: fictional Malaysian companies (no real company names or logos).
// They commit roles exclusively to PTPTN graduates. "Today" is 7 Oct 2026.

const pass = 'pass' as const

export const PARTNERS: TalentPartner[] = [
  {
    id: 'seri-mutiara', name: 'Seri Mutiara Logistik Berhad', monogram: 'SM', sector: 'Logistics', hq: 'Selangor', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 24, salaryFloorRM: 3200, responseDays: 3, signedAt: '2025-11-01', renewsAt: '2026-11-01' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 4,
    metrics: { rolesPosted: 19, invitations: 142, acceptanceRate: 0.61, hires: 11, avgResponseHours: 30, complaints: 0 }, notes: [],
  },
  {
    id: 'awan-tek', name: 'Awan Teknologi Sdn Bhd', monogram: 'AT', sector: 'Technology', hq: 'WP Kuala Lumpur', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 30, salaryFloorRM: 3800, responseDays: 2, signedAt: '2025-10-15', renewsAt: '2026-10-15' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 6,
    metrics: { rolesPosted: 26, invitations: 210, acceptanceRate: 0.55, hires: 14, avgResponseHours: 20, complaints: 1 }, notes: [],
  },
  {
    id: 'cahaya-tenaga', name: 'Cahaya Tenaga Berhad', monogram: 'CT', sector: 'Energy', hq: 'Johor', status: 'active', partnerType: 'GLC',
    agreement: { rolesPerYear: 20, salaryFloorRM: 4000, responseDays: 5, signedAt: '2025-09-01', renewsAt: '2026-09-01' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 3,
    metrics: { rolesPosted: 9, invitations: 64, acceptanceRate: 0.48, hires: 4, avgResponseHours: 96, complaints: 0 }, notes: [],
  },
  {
    id: 'permata-health', name: 'Permata Health Group', monogram: 'PH', sector: 'Healthcare', hq: 'Pulau Pinang', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 15, salaryFloorRM: 3000, responseDays: 3, signedAt: '2026-01-10', renewsAt: '2027-01-10' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 2,
    metrics: { rolesPosted: 11, invitations: 58, acceptanceRate: 0.64, hires: 6, avgResponseHours: 40, complaints: 0 }, notes: [],
  },
  {
    id: 'rimba-agro', name: 'Rimba Agro Berhad', monogram: 'RA', sector: 'Plantation & agri-food', hq: 'Sarawak', status: 'active', partnerType: 'GLC',
    agreement: { rolesPerYear: 18, salaryFloorRM: 3200, responseDays: 4, signedAt: '2025-12-01', renewsAt: '2026-12-01' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 3,
    metrics: { rolesPosted: 14, invitations: 97, acceptanceRate: 0.58, hires: 8, avgResponseHours: 36, complaints: 0 }, notes: [],
  },
  {
    id: 'lestari-bina', name: 'Lestari Bina Berhad', monogram: 'LB', sector: 'Construction', hq: 'Selangor', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 16, salaryFloorRM: 3500, responseDays: 3, signedAt: '2026-02-01', renewsAt: '2027-02-01' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 2,
    metrics: { rolesPosted: 5, invitations: 31, acceptanceRate: 0.42, hires: 2, avgResponseHours: 110, complaints: 0 }, notes: [],
  },
  {
    id: 'selat-capital', name: 'Selat Capital Berhad', monogram: 'SC', sector: 'Financial services', hq: 'WP Kuala Lumpur', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 12, salaryFloorRM: 4200, responseDays: 2, signedAt: '2026-03-01', renewsAt: '2027-03-01' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'complete', seats: 3,
    metrics: { rolesPosted: 8, invitations: 77, acceptanceRate: 0.66, hires: 5, avgResponseHours: 18, complaints: 0 }, notes: [],
  },
  {
    id: 'dian-retail', name: 'Dian Retail Group', monogram: 'DR', sector: 'Retail', hq: 'Selangor', status: 'paused', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 20, salaryFloorRM: 2800, responseDays: 3, signedAt: '2025-08-01', renewsAt: '2026-08-01' },
    verification: { ssm: pass, domain: pass, hrContacts: 'warn', agreement: pass }, onboardingStage: 'complete', seats: 2,
    metrics: { rolesPosted: 6, invitations: 40, acceptanceRate: 0.3, hires: 1, avgResponseHours: 140, complaints: 2 }, notes: [],
  },
  {
    id: 'kestrel-aero', name: 'Kestrel Aero Services Sdn Bhd', monogram: 'KA', sector: 'Aerospace MRO', hq: 'Selangor', status: 'active', partnerType: 'privateLarge',
    agreement: { rolesPerYear: 10, salaryFloorRM: 3600, responseDays: 3, signedAt: '2026-08-12', renewsAt: '2027-08-12' },
    verification: { ssm: pass, domain: pass, hrContacts: pass, agreement: pass }, onboardingStage: 'probation', probationEndsAt: '2026-10-11', seats: 2,
    metrics: { rolesPosted: 3, invitations: 12, acceptanceRate: 0.5, hires: 0, avgResponseHours: 48, complaints: 0 }, notes: [],
  },
  {
    id: 'merdu-telekom', name: 'Merdu Telekom Berhad', monogram: 'MT', sector: 'Telecommunications', hq: 'WP Kuala Lumpur', status: 'onboarding', partnerType: 'ptptnCorporate',
    agreement: { rolesPerYear: 25, salaryFloorRM: 3500, responseDays: 3 },
    verification: { ssm: pass, domain: pass, hrContacts: 'pending', agreement: 'pending' }, onboardingStage: 'verification', seats: 0,
    metrics: { rolesPosted: 0, invitations: 0, acceptanceRate: 0, hires: 0, avgResponseHours: 0, complaints: 0 }, notes: [],
  },
]

type Req = PartnerRole['requiredSkills']
const req = (...pairs: [string, 'foundation' | 'working' | 'advanced'][]): Req => pairs.map(([skillId, level]) => ({ skillId, level }))

export const PARTNER_ROLES: PartnerRole[] = [
  { id: 'pr-01', partnerId: 'seri-mutiara', title: 'Logistics Executive (Graduate)', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 3800, max: 4500 }, contractType: 'graduateProgramme', requiredSkills: req(['logistics-coordination', 'working'], ['spreadsheet-modelling', 'working'], ['stakeholder-communication', 'working'], ['inventory-management', 'foundation']), description: 'Plan daily inbound and outbound loads for the Shah Alam hub and work with hauliers on delivery windows. 18-month graduate programme with rotations in warehousing and transport.', postedAt: '2026-09-28', closesAt: '2026-10-30', status: 'live' },
  { id: 'pr-02', partnerId: 'rimba-agro', title: 'Graduate Trainee, Supply Chain', location: 'Sarawak', workMode: 'onsite', salaryRM: { min: 3500, max: 4200 }, contractType: 'graduateProgramme', requiredSkills: req(['data-analysis', 'working'], ['logistics-coordination', 'working'], ['report-writing', 'foundation']), description: 'Join the Kuching supply chain team: forecast fertiliser demand across estates and track mill-to-port shipments.', postedAt: '2026-09-02', closesAt: '2026-10-25', status: 'live' },
  { id: 'pr-03', partnerId: 'awan-tek', title: 'Junior Data Analyst', location: 'WP Kuala Lumpur', workMode: 'hybrid', salaryRM: { min: 4200, max: 5200 }, contractType: 'permanent', requiredSkills: req(['data-analysis', 'working'], ['sql-databases', 'working'], ['data-visualisation', 'working'], ['programming-python', 'foundation']), description: 'Build dashboards for the cloud operations team and help product managers answer questions with data.', postedAt: '2026-09-30', closesAt: '2026-11-15', status: 'live' },
  { id: 'pr-04', partnerId: 'cahaya-tenaga', title: 'Graduate Engineer, Grid Systems', location: 'Johor', workMode: 'onsite', salaryRM: { min: 4200, max: 5200 }, contractType: 'graduateProgramme', requiredSkills: req(['engineering-design', 'working'], ['health-safety', 'working'], ['technical-problem-solving', 'working'], ['report-writing', 'foundation']), description: 'Rotate through substation design, protection and maintenance in the southern region.', postedAt: '2026-10-01', closesAt: '2026-11-20', status: 'live' },
  { id: 'pr-05', partnerId: 'cahaya-tenaga', title: 'Solar PV Engineer', location: 'Johor', workMode: 'onsite', salaryRM: { min: 4500, max: 5500 }, contractType: 'permanent', requiredSkills: req(['engineering-design', 'advanced'], ['lab-testing', 'working'], ['project-management', 'working']), description: 'Design and commission rooftop and ground-mount solar systems for commercial clients.', postedAt: '2026-09-10', closesAt: '2026-10-31', status: 'live' },
  { id: 'pr-06', partnerId: 'permata-health', title: 'Operations Associate', location: 'Pulau Pinang', workMode: 'onsite', salaryRM: { min: 3200, max: 3800 }, contractType: 'permanent', requiredSkills: req(['process-improvement', 'working'], ['scheduling', 'working'], ['customer-service', 'working']), description: 'Improve patient flow and staff rosters across two Penang hospitals.', postedAt: '2026-09-18', closesAt: '2026-10-28', status: 'live' },
  { id: 'pr-07', partnerId: 'lestari-bina', title: 'Graduate Procurement Executive', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 3500, max: 4100 }, contractType: 'graduateProgramme', requiredSkills: req(['procurement', 'working'], ['negotiation', 'foundation'], ['spreadsheet-modelling', 'working']), description: 'Source materials and subcontractors for mid-rise residential projects in the Klang Valley.', postedAt: '2026-09-25', closesAt: '2026-10-29', status: 'live' },
  { id: 'pr-08', partnerId: 'selat-capital', title: 'Management Associate', location: 'WP Kuala Lumpur', workMode: 'hybrid', salaryRM: { min: 4500, max: 5500 }, contractType: 'graduateProgramme', requiredSkills: req(['financial-analysis', 'working'], ['critical-thinking', 'working'], ['public-speaking', 'working']), description: 'Two-year leadership programme rotating through credit, operations and digital banking.', postedAt: '2026-10-03', closesAt: '2026-11-30', status: 'live' },
  { id: 'pr-09', partnerId: 'awan-tek', title: 'Digital Marketing Executive', location: 'WP Kuala Lumpur', workMode: 'hybrid', salaryRM: { min: 3500, max: 4200 }, contractType: 'permanent', requiredSkills: req(['digital-marketing', 'working'], ['social-media', 'working'], ['market-research', 'foundation']), description: 'Run campaigns for Awan cloud products across social and search, and report what works.', postedAt: '2026-09-15', closesAt: '2026-10-31', status: 'live' },
  { id: 'pr-10', partnerId: 'kestrel-aero', title: 'Quality Assurance Engineer', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 3800, max: 4600 }, contractType: 'permanent', requiredSkills: req(['quality-control', 'working'], ['health-safety', 'working'], ['report-writing', 'working']), description: 'Inspect and certify aircraft component repairs at the Subang base.', postedAt: '2026-09-20', closesAt: '2026-10-27', status: 'live' },
  { id: 'pr-11', partnerId: 'seri-mutiara', title: 'Inventory Control Analyst', location: 'Negeri Sembilan', workMode: 'onsite', salaryRM: { min: 3500, max: 4000 }, contractType: 'permanent', requiredSkills: req(['inventory-management', 'working'], ['spreadsheet-modelling', 'advanced'], ['data-analysis', 'foundation']), description: 'Own stock accuracy for the Senawang distribution centre.', postedAt: '2026-08-30', closesAt: '2026-10-20', status: 'live' },
  { id: 'pr-12', partnerId: 'rimba-agro', title: 'Sustainability Data Officer', location: 'Sarawak', workMode: 'hybrid', salaryRM: { min: 3600, max: 4300 }, contractType: 'permanent', requiredSkills: req(['data-analysis', 'working'], ['report-writing', 'working'], ['research-methods', 'foundation']), description: 'Track estate emissions and prepare sustainability disclosures.', postedAt: '2026-09-05', closesAt: '2026-10-26', status: 'live' },
  // Pending approval (agency queue, Phase 5): below salary floor, contract type, partner on probation.
  { id: 'pr-13', partnerId: 'dian-retail', title: 'Store Management Trainee', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 2600, max: 2900 }, contractType: 'graduateProgramme', requiredSkills: req(['customer-service', 'working'], ['team-leadership', 'foundation']), description: 'Rotate across Klang Valley stores before leading a store team.', postedAt: '2026-10-05', closesAt: '2026-11-05', status: 'pendingApproval' },
  { id: 'pr-14', partnerId: 'lestari-bina', title: 'Site Safety Officer (12-month contract)', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 3400, max: 3800 }, contractType: 'contract', requiredSkills: req(['health-safety', 'working'], ['report-writing', 'foundation']), description: 'Run site safety inspections for a residential project.', postedAt: '2026-10-06', closesAt: '2026-11-06', status: 'pendingApproval' },
  { id: 'pr-15', partnerId: 'kestrel-aero', title: 'Planning Engineer', location: 'Selangor', workMode: 'onsite', salaryRM: { min: 3800, max: 4400 }, contractType: 'permanent', requiredSkills: req(['scheduling', 'working'], ['technical-problem-solving', 'working']), description: 'Plan maintenance slots for the MRO hangar.', postedAt: '2026-10-06', closesAt: '2026-11-06', status: 'pendingApproval' },
]

export const INVITATIONS: Invitation[] = [
  {
    id: 'inv-01', roleId: 'pr-01', studentId: 'hafiz', stage: 'invited', sentAt: '2026-10-05', replyBy: '2026-10-09', matchPct: 0, whyYouMatch: [], profileShared: false, messages: [
      { from: 'partner', body: 'Hi! Your flood relief logistics experience stood out. We’d love to tell you more about our graduate programme in Shah Alam.', at: '2026-10-05T10:12:00+08:00', identityHidden: false },
    ],
  },
  {
    id: 'inv-02', roleId: 'pr-02', studentId: 'hafiz', stage: 'talking', sentAt: '2026-09-29', replyBy: '2026-10-06', matchPct: 0, whyYouMatch: [], profileShared: true, messages: [
      { from: 'partner', body: 'Thanks for accepting. Are you open to being based in Kuching for the first 12 months?', at: '2026-09-30T09:00:00+08:00', identityHidden: false },
      { from: 'student', body: 'Yes, I’m open to relocating. Is accommodation support provided?', at: '2026-09-30T20:41:00+08:00', identityHidden: false },
      { from: 'partner', body: 'Yes, 3 months’ housing allowance. We’ll propose interview slots this week.', at: '2026-10-01T11:05:00+08:00', identityHidden: false },
    ],
  },
]

/** Partner interest this week vs last week (profile views by Talent Partners). */
export const PARTNER_INTEREST: Record<string, { viewsThisWeek: number; viewsLastWeek: number }> = {
  hafiz: { viewsThisWeek: 14, viewsLastWeek: 9 },
  kavitha: { viewsThisWeek: 6, viewsLastWeek: 7 },
  nurul: { viewsThisWeek: 0, viewsLastWeek: 0 },
}
