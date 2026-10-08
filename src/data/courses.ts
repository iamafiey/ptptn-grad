import type { Course, Enrolment, Provider } from '@/types/domain'

// Course catalogue (fictional providers). Every course maps to at least one taxonomy skill.

export const PROVIDERS: Provider[] = [
  { id: 'akademi-digital', name: 'Akademi Digital Malaysia', monogram: 'AD', rating: 4.6, completionRate: 0.72 },
  { id: 'kolej-logistik', name: 'Kolej Logistik Nusantara', monogram: 'KL', rating: 4.4, completionRate: 0.68 },
  { id: 'teknik-hijau', name: 'Institut Teknik Hijau', monogram: 'TH', rating: 4.5, completionRate: 0.64 },
  { id: 'bijak-niaga', name: 'Bijak Niaga Academy', monogram: 'BN', rating: 4.1, completionRate: 0.55 },
  { id: 'cakna-kerjaya', name: 'Cakna Kerjaya Learning', monogram: 'CK', rating: 3.6, completionRate: 0.38, flagged: true },
]

const c = (
  id: string,
  providerId: string,
  en: string,
  ms: string,
  skillIds: string[],
  levelCap: Course['levelCap'],
  durationHours: number,
  cost: Course['cost'],
  costRM: number | undefined,
  format: Course['format'],
  hosted: boolean,
  tierAccess: Course['tierAccess'],
  enrolments: number,
  completionRate: number,
): Course => ({
  id, providerId, title: { en, ms }, skillIds, levelCap, durationHours, cost, costRM, format, hosted,
  certificate: hosted ? 'PTPTN-recognised certificate' : 'Provider certificate',
  tierAccess, status: 'live', enrolments, completionRate,
})

export const COURSES: Course[] = [
  c('c-sql', 'akademi-digital', 'SQL for Analysts', 'SQL untuk Penganalisis', ['sql-databases', 'data-analysis'], 'working', 12, 'free', undefined, 'selfPaced', true, 'all', 3420, 0.71),
  c('c-powerbi', 'akademi-digital', 'Dashboards with Power BI', 'Papan Pemuka dengan Power BI', ['data-visualisation', 'data-analysis'], 'working', 16, 'subsidised', 49, 'selfPaced', true, 'tierAFullTierBPreview', 2210, 0.66),
  c('c-python', 'akademi-digital', 'Python Foundations', 'Asas Python', ['programming-python'], 'working', 20, 'free', undefined, 'selfPaced', true, 'all', 4180, 0.58),
  c('c-wms', 'kolej-logistik', 'Warehouse Analytics', 'Analitik Gudang', ['inventory-management', 'spreadsheet-modelling'], 'advanced', 18, 'subsidised', 79, 'blended', true, 'tierAFullTierBPreview', 860, 0.7),
  c('c-procure', 'kolej-logistik', 'Procurement Essentials', 'Asas Perolehan', ['procurement', 'negotiation'], 'working', 10, 'free', undefined, 'selfPaced', true, 'all', 1290, 0.74),
  c('c-lean', 'kolej-logistik', 'Lean Process Improvement', 'Penambahbaikan Proses Lean', ['process-improvement'], 'working', 14, 'subsidised', 59, 'live', true, 'tierAFullTierBPreview', 940, 0.69),
  c('c-cips', 'kolej-logistik', 'Certificate in Supply Chain Planning', 'Sijil Perancangan Rantaian Bekalan', ['logistics-coordination', 'scheduling'], 'advanced', 40, 'paid', 890, 'blended', false, 'tierAOnly', 320, 0.61),
  c('c-pv', 'teknik-hijau', 'Solar PV Design Fundamentals', 'Asas Reka Bentuk Solar PV', ['engineering-design', 'lab-testing'], 'advanced', 24, 'subsidised', 120, 'blended', true, 'tierAFullTierBPreview', 610, 0.63),
  c('c-osh', 'teknik-hijau', 'Workplace Safety (OSH) Basics', 'Asas Keselamatan Tempat Kerja (KKP)', ['health-safety'], 'working', 8, 'free', undefined, 'selfPaced', true, 'all', 2750, 0.82),
  c('c-pm', 'bijak-niaga', 'Project Management Basics', 'Asas Pengurusan Projek', ['project-management', 'scheduling'], 'working', 12, 'free', undefined, 'selfPaced', true, 'all', 3010, 0.6),
  c('c-fin', 'bijak-niaga', 'Financial Statements for Beginners', 'Penyata Kewangan untuk Pemula', ['financial-analysis', 'budgeting'], 'working', 10, 'subsidised', 39, 'selfPaced', true, 'tierAFullTierBPreview', 1440, 0.57),
  c('c-present', 'bijak-niaga', 'Presenting with Confidence', 'Membentang dengan Yakin', ['public-speaking'], 'working', 6, 'free', undefined, 'live', true, 'all', 1880, 0.77),
  c('c-dm', 'cakna-kerjaya', 'Digital Marketing Bootcamp', 'Kem Pemasaran Digital', ['digital-marketing', 'social-media'], 'working', 30, 'paid', 450, 'live', false, 'tierAOnly', 540, 0.36),
  c('c-excel', 'akademi-digital', 'Advanced Excel for Business', 'Excel Lanjutan untuk Perniagaan', ['spreadsheet-modelling'], 'advanced', 10, 'free', undefined, 'selfPaced', true, 'all', 5120, 0.79),
]

export const ENROLMENTS_SEED: Record<string, Enrolment[]> = {
  hafiz: [{ courseId: 'c-sql', studentId: 'hafiz', status: 'inProgress', progressPct: 40, lastActivityAt: '2026-10-05' }],
  kavitha: [{ courseId: 'c-osh', studentId: 'kavitha', status: 'completed', progressPct: 100, lastActivityAt: '2026-06-02', certificateEvidenceId: 'kav-e2' }],
  nurul: [],
}
