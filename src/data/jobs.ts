import type { MalaysianState, OpenJob, Portal } from '@/types/domain'

// Fictional job portals PTPTN has (or is discussing) data agreements with. No scraping:
// "feed" portals send listings; the link-out portal only gets a curated entry and search shortcuts.

export const PORTALS: Portal[] = [
  { id: 'kerjakini', name: 'KerjaKini', monogram: 'KK', agreement: 'activeFeed', lastSyncAt: '2026-10-07T06:00:00+08:00', listingsImported: 14, feedHealth: 'ok', searchUrlTemplate: 'https://kerjakini.example/search?q={q}' },
  { id: 'laluankerjaya', name: 'LaluanKerjaya', monogram: 'LK', agreement: 'activeFeed', lastSyncAt: '2026-10-04T06:00:00+08:00', listingsImported: 12, feedHealth: 'stale', searchUrlTemplate: 'https://laluankerjaya.example/cari?kata={q}' },
  { id: 'mulakerja', name: 'MulaKerja', monogram: 'MK', agreement: 'linkOutOnly', listingsImported: 0, feedHealth: 'ok', searchUrlTemplate: 'https://mulakerja.example/jobs?keyword={q}' },
]

type Row = [string, string, MalaysianState, number | null, number | null, string, string[]]

// [title, company, state, salary min, salary max, posted, skills]
const KK: Row[] = [
  ['Supply Chain Analyst', 'Teras Niaga Distribution', 'Selangor', 3600, 4200, '2026-10-02', ['data-analysis', 'spreadsheet-modelling', 'logistics-coordination']],
  ['Warehouse Executive', 'Gudang Prima Sdn Bhd', 'Negeri Sembilan', 3000, 3500, '2026-10-01', ['inventory-management', 'team-leadership']],
  ['Transport Planner', 'Laju Haulage Sdn Bhd', 'Selangor', 3200, 3800, '2026-09-29', ['logistics-coordination', 'scheduling']],
  ['Purchasing Executive', 'Bina Jaya Materials', 'WP Kuala Lumpur', 3100, 3600, '2026-09-27', ['procurement', 'negotiation', 'spreadsheet-modelling']],
  ['Business Analyst (Graduate)', 'Delima Insurance Berhad', 'WP Kuala Lumpur', 4000, 4800, '2026-10-03', ['data-analysis', 'critical-thinking', 'report-writing']],
  ['Marketing Executive', 'Teh Tarik Co.', 'Selangor', 3000, 3500, '2026-10-04', ['digital-marketing', 'social-media', 'market-research']],
  ['Social Media Executive', 'Kain Songket Studio', 'WP Kuala Lumpur', 2800, 3300, '2026-10-05', ['social-media', 'digital-marketing']],
  ['Electrical Engineer', 'Arus Murni Engineering', 'Johor', 3800, 4500, '2026-09-30', ['engineering-design', 'technical-problem-solving', 'health-safety']],
  ['QA/QC Engineer', 'Presisi Components Sdn Bhd', 'Pulau Pinang', 3600, 4300, '2026-09-28', ['quality-control', 'lab-testing', 'report-writing']],
  ['Customer Success Associate', 'Sembang Software', 'WP Kuala Lumpur', 3200, 3700, '2026-10-06', ['customer-service', 'bilingual-communication']],
  ['Operations Executive', 'Harum Foods Manufacturing', 'Perak', 3000, 3400, '2026-09-26', ['process-improvement', 'scheduling', 'team-leadership']],
  ['Junior Accountant', 'Kira Tepat & Co.', 'Selangor', 3000, 3400, '2026-10-01', ['budgeting', 'financial-analysis', 'spreadsheet-modelling']],
  ['Event Executive', 'Majlis Hebat Events', 'WP Kuala Lumpur', 2800, 3200, '2026-10-02', ['event-management', 'stakeholder-communication']],
  ['Sales Executive', 'Cerah Solar Solutions', 'Johor', 2800, 3600, '2026-10-03', ['sales', 'customer-service', 'negotiation']],
]

const LK: Row[] = [
  ['Logistics Coordinator', 'Pantas Express Sdn Bhd', 'Selangor', 3200, 3700, '2026-09-24', ['logistics-coordination', 'stakeholder-communication']],
  ['Inventory Analyst', 'Kedai Rakyat Holdings', 'Selangor', 3300, 3900, '2026-09-25', ['inventory-management', 'spreadsheet-modelling', 'data-analysis']],
  ['Data Analyst', 'Awan Biru Analytics', 'WP Kuala Lumpur', 3800, 4600, '2026-09-23', ['data-analysis', 'sql-databases', 'data-visualisation']],
  ['Junior Python Developer', 'Kod Merdeka Labs', 'WP Kuala Lumpur', 3800, 4500, '2026-09-22', ['programming-python', 'web-development']],
  ['Maintenance Engineer', 'Kilang Besi Utara', 'Kedah', 3500, 4200, '2026-09-21', ['technical-problem-solving', 'health-safety']],
  ['Project Coordinator', 'Lestari Interiors', 'Selangor', 3000, 3500, '2026-09-24', ['project-management', 'scheduling', 'stakeholder-communication']],
  ['HR Executive', 'Sinar Manpower', 'Melaka', 2800, 3300, '2026-09-23', ['conflict-resolution', 'report-writing']],
  ['Brand Executive', 'Manis Bakery Group', 'Pulau Pinang', 3000, 3500, '2026-09-22', ['digital-marketing', 'market-research', 'social-media']],
  ['Research Assistant', 'Institut Kajian Dasar', 'WP Putrajaya', 2800, 3200, '2026-09-20', ['research-methods', 'statistical-analysis', 'report-writing']],
  ['Renewable Energy Technician', 'Matahari Hijau Sdn Bhd', 'Johor', 3000, 3600, '2026-09-25', ['lab-testing', 'technical-problem-solving']],
  ['Procurement Assistant', 'Pelabuhan Utara Services', 'Pulau Pinang', 2900, 3300, '2026-09-21', ['procurement', 'spreadsheet-modelling']],
  ['Finance Executive', 'Wang Selamat Credit', 'WP Kuala Lumpur', 3400, 4000, '2026-09-24', ['financial-analysis', 'budgeting']],
]

const MK: Row[] = [
  ['Graduate Logistics Trainee', 'Kargo Nusantara', 'Selangor', null, null, '2026-10-01', ['logistics-coordination']],
  ['Marketing Assistant', 'Tenun Moden', 'Kelantan', null, null, '2026-09-30', ['digital-marketing']],
  ['Junior Electrical Designer', 'Rekabina Elektrik', 'Johor', null, null, '2026-09-29', ['engineering-design']],
  ['Admin & Operations Executive', 'Klinik Sihat Bersama', 'Perak', null, null, '2026-10-02', ['scheduling', 'customer-service']],
]

const build = (portalId: string, rows: Row[]): OpenJob[] =>
  rows.map(([title, company, location, min, max, postedAt, skillIds], i) => ({
    id: `${portalId}-${String(i + 1).padStart(2, '0')}`,
    portalId,
    title,
    company,
    location,
    salaryRM: min && max ? { min, max } : undefined,
    postedAt,
    skillIds,
    matchPct: 0,
    externalUrl: `https://${portalId}.example/jobs/${i + 1}`,
  }))

export const OPEN_JOBS: OpenJob[] = [...build('kerjakini', KK), ...build('laluankerjaya', LK), ...build('mulakerja', MK)]
