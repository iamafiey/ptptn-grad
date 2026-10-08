import type { LocalizedText, RubricLevelRule, SkillCategory, SkillCategoryId, TaxonomySkill, TaxonomyVersion } from '@/types/domain'

// Skill taxonomy v3.2: 40 skills in 6 categories. Each skill has a 3-level rubric
// (Foundation / Working / Advanced) and evidence weights. Fictional, prototype only.

export const CATEGORIES: SkillCategory[] = [
  { id: 'leadership', name: { en: 'Leadership & teamwork', ms: 'Kepimpinan & kerja berpasukan' } },
  { id: 'communication', name: { en: 'Communication', ms: 'Komunikasi' } },
  { id: 'operations', name: { en: 'Operations & logistics', ms: 'Operasi & logistik' } },
  { id: 'digital', name: { en: 'Digital & data', ms: 'Digital & data' } },
  { id: 'business', name: { en: 'Business & finance', ms: 'Perniagaan & kewangan' } },
  { id: 'problemSolving', name: { en: 'Problem solving & research', ms: 'Penyelesaian masalah & penyelidikan' } },
]

// Shared rubric shape; the rubric rule engine reads minMonths / minScale / requiresVerifiedEvidence.
const RUBRIC: RubricLevelRule[] = [
  {
    level: 'foundation',
    criteria: [
      { en: 'Took part in a related activity, course or role', ms: 'Menyertai aktiviti, kursus atau peranan berkaitan' },
    ],
  },
  {
    level: 'working',
    minMonths: 6,
    criteria: [
      { en: '6+ months of responsibility, or a graded project at B or above', ms: '6+ bulan tanggungjawab, atau projek bergred B ke atas' },
      { en: 'Outcome described with scale (people, money, output)', ms: 'Hasil dinyatakan dengan skala (orang, wang, output)' },
    ],
  },
  {
    level: 'advanced',
    minMonths: 12,
    minScale: 100,
    requiresVerifiedEvidence: true,
    criteria: [
      { en: '12+ months in a lead role', ms: '12+ bulan dalam peranan utama' },
      { en: 'Scale of 100+ (people served, items, RM thousands)', ms: 'Skala 100+ (orang dilayan, item, ribu RM)' },
      { en: 'At least one verified piece of evidence', ms: 'Sekurang-kurangnya satu bukti disahkan' },
    ],
  },
]

const W = { activity: 0.4, certificate: 0.3, transcript: 0.2, reference: 0.1 }

function skill(
  id: string,
  categoryId: SkillCategoryId,
  name: LocalizedText,
  definition: string,
  exampleActivities: string[],
  relatedRoles: string[],
  demand: TaxonomySkill['demand'] = 'medium',
): TaxonomySkill {
  return { id, categoryId, name, definition: { en: definition }, exampleActivities, relatedRoles, rubric: RUBRIC, evidenceWeights: W, demand }
}

export const SKILLS: TaxonomySkill[] = [
  // Leadership & teamwork (6)
  skill('team-leadership', 'leadership', { en: 'Team leadership', ms: 'Kepimpinan pasukan' }, 'Guides a group towards a shared goal and keeps people accountable.', ['Club exco', 'Shift lead', 'Project lead'], ['Management Trainee', 'Operations Executive'], 'high'),
  skill('event-management', 'leadership', { en: 'Event management', ms: 'Pengurusan acara' }, 'Plans and runs events end to end: venue, people, budget, run-sheet.', ['Programme director', 'Career fair committee'], ['Event Executive', 'Marketing Executive']),
  skill('volunteer-coordination', 'leadership', { en: 'Volunteer coordination', ms: 'Penyelarasan sukarelawan' }, 'Recruits, briefs and schedules volunteers.', ['Relief drives', 'Community programmes'], ['Community Officer', 'CSR Executive']),
  skill('mentoring', 'leadership', { en: 'Mentoring & coaching', ms: 'Bimbingan & latihan' }, 'Helps others learn through tutoring, coaching or buddy schemes.', ['Peer tutor', 'Senior buddy'], ['Trainer', 'HR Executive'], 'low'),
  skill('decision-making', 'leadership', { en: 'Decision making', ms: 'Membuat keputusan' }, 'Weighs options and commits under time pressure.', ['Committee chair', 'Competition captain'], ['Management Associate']),
  skill('conflict-resolution', 'leadership', { en: 'Conflict resolution', ms: 'Penyelesaian konflik' }, 'Resolves disagreements between people fairly.', ['Residential college rep', 'Customer complaints'], ['HR Executive', 'Customer Success'], 'low'),

  // Communication (7)
  skill('stakeholder-communication', 'communication', { en: 'Stakeholder communication', ms: 'Komunikasi pihak berkepentingan' }, 'Keeps partners, sponsors and officials informed and aligned.', ['Liaising with district office', 'Sponsor updates'], ['Account Executive', 'Project Coordinator'], 'high'),
  skill('public-speaking', 'communication', { en: 'Public speaking & presentation', ms: 'Pengucapan awam & pembentangan' }, 'Presents ideas clearly to an audience.', ['Case competition pitch', 'Emcee'], ['Sales Executive', 'Consultant']),
  skill('report-writing', 'communication', { en: 'Report writing', ms: 'Penulisan laporan' }, 'Writes structured reports, proposals and minutes.', ['FYP thesis', 'Club secretary'], ['Analyst', 'Engineer']),
  skill('bilingual-communication', 'communication', { en: 'Bilingual communication (BM/EN)', ms: 'Komunikasi dwibahasa (BM/BI)' }, 'Works fluently in Bahasa Melayu and English.', ['Translation volunteer', 'Bilingual MC'], ['Customer Service', 'Public Relations']),
  skill('negotiation', 'communication', { en: 'Negotiation', ms: 'Rundingan' }, 'Reaches agreement on price, terms or scope.', ['Sponsorship deals', 'Vendor quotes'], ['Procurement Executive', 'Sales Executive']),
  skill('customer-service', 'communication', { en: 'Customer service', ms: 'Khidmat pelanggan' }, 'Serves customers patiently and solves their problems.', ['Barista', 'Retail assistant'], ['Customer Service', 'Retail Executive']),
  skill('social-media', 'communication', { en: 'Social media content', ms: 'Kandungan media sosial' }, 'Plans and creates content that grows an audience.', ['Club Instagram', 'Small business TikTok'], ['Digital Marketing Executive'], 'high'),

  // Operations & logistics (7)
  skill('logistics-coordination', 'operations', { en: 'Logistics coordination', ms: 'Penyelarasan logistik' }, 'Moves goods and people to the right place on time.', ['Relief supply distribution', 'Event logistics'], ['Logistics Executive', 'Supply Chain Analyst'], 'high'),
  skill('inventory-management', 'operations', { en: 'Inventory management', ms: 'Pengurusan inventori' }, 'Tracks stock levels, reconciles counts and prevents shortages.', ['Warehouse internship', 'Club store'], ['Inventory Controller', 'Supply Chain Analyst']),
  skill('procurement', 'operations', { en: 'Procurement', ms: 'Perolehan' }, 'Sources suppliers, compares quotes and raises orders.', ['Event purchasing', 'Procurement coursework'], ['Procurement Executive']),
  skill('process-improvement', 'operations', { en: 'Process improvement', ms: 'Penambahbaikan proses' }, 'Finds waste in a process and measures the improvement.', ['Route optimisation project', 'Lean project'], ['Operations Analyst', 'Industrial Engineer'], 'high'),
  skill('scheduling', 'operations', { en: 'Scheduling & planning', ms: 'Penjadualan & perancangan' }, 'Builds timelines and rosters that hold up.', ['Duty rosters', 'Run-sheets'], ['Planner', 'Project Coordinator']),
  skill('health-safety', 'operations', { en: 'Health & safety compliance', ms: 'Pematuhan keselamatan & kesihatan' }, 'Applies HSE rules and spots hazards.', ['Lab safety officer', 'Site internship'], ['HSE Officer', 'Site Engineer']),
  skill('quality-control', 'operations', { en: 'Quality control', ms: 'Kawalan kualiti' }, 'Checks output against a standard and records defects.', ['QC internship', 'Lab testing'], ['QA/QC Engineer']),

  // Digital & data (7)
  skill('data-analysis', 'digital', { en: 'Data analysis', ms: 'Analisis data' }, 'Cleans and analyses data to answer a question.', ['FYP analysis', 'Internship dashboard'], ['Data Analyst', 'Business Analyst'], 'high'),
  skill('spreadsheet-modelling', 'digital', { en: 'Advanced Excel', ms: 'Excel lanjutan' }, 'Builds spreadsheet models with lookups, pivots and formulas.', ['Inventory reconciliation', 'Budget tracker'], ['Analyst', 'Finance Executive'], 'high'),
  skill('data-visualisation', 'digital', { en: 'Data visualisation', ms: 'Visualisasi data' }, 'Turns numbers into clear charts and dashboards.', ['Dashboard', 'Infographics'], ['Data Analyst']),
  skill('programming-python', 'digital', { en: 'Programming (Python)', ms: 'Pengaturcaraan (Python)' }, 'Writes scripts and small programs in Python.', ['Automation script', 'Sensor data logger'], ['Software Engineer', 'Data Engineer'], 'high'),
  skill('digital-marketing', 'digital', { en: 'Digital marketing', ms: 'Pemasaran digital' }, 'Runs online campaigns and reads their results.', ['Boosted posts', 'Campaign A/B test'], ['Digital Marketing Executive'], 'high'),
  skill('web-development', 'digital', { en: 'Web development', ms: 'Pembangunan web' }, 'Builds and maintains web pages or apps.', ['Club website', 'Freelance site'], ['Web Developer']),
  skill('sql-databases', 'digital', { en: 'Databases & SQL', ms: 'Pangkalan data & SQL' }, 'Queries and designs relational data.', ['Database coursework', 'Internship reporting'], ['Data Analyst', 'Software Engineer']),

  // Business & finance (7)
  skill('budgeting', 'business', { en: 'Budgeting & financial tracking', ms: 'Belanjawan & penjejakan kewangan' }, 'Plans a budget and tracks spending against it.', ['Club treasurer', 'Event budget'], ['Finance Executive', 'Account Assistant']),
  skill('fundraising', 'business', { en: 'Fundraising & sponsorship', ms: 'Kutipan dana & penajaan' }, 'Raises money or in-kind support from donors and sponsors.', ['Sponsorship drive', 'Charity run'], ['CSR Executive', 'Business Development']),
  skill('sales', 'business', { en: 'Sales & business development', ms: 'Jualan & pembangunan perniagaan' }, 'Finds customers and closes sales.', ['Retail sales', 'Bazaar stall'], ['Sales Executive', 'Business Development'], 'high'),
  skill('market-research', 'business', { en: 'Market research', ms: 'Penyelidikan pasaran' }, 'Gathers customer and competitor insight.', ['Survey project', 'Product research'], ['Marketing Executive', 'Research Analyst']),
  skill('entrepreneurship', 'business', { en: 'Entrepreneurship', ms: 'Keusahawanan' }, 'Starts and runs a small venture.', ['Online shop', 'Campus business'], ['Business Development']),
  skill('financial-analysis', 'business', { en: 'Financial analysis', ms: 'Analisis kewangan' }, 'Reads financial statements and builds simple models.', ['Finance coursework', 'Investment club'], ['Financial Analyst', 'Management Associate']),
  skill('project-management', 'business', { en: 'Project management', ms: 'Pengurusan projek' }, 'Delivers a project on scope, time and budget.', ['FYP', 'Event project'], ['Project Coordinator', 'Graduate Engineer'], 'high'),

  // Problem solving & research (6)
  skill('research-methods', 'problemSolving', { en: 'Research methods', ms: 'Kaedah penyelidikan' }, 'Designs a study, collects data and draws sound conclusions.', ['FYP', 'Research assistant'], ['Research Assistant', 'Analyst']),
  skill('critical-thinking', 'problemSolving', { en: 'Critical thinking', ms: 'Pemikiran kritis' }, 'Breaks down problems and tests assumptions.', ['Case competition', 'Debate'], ['Consultant', 'Management Associate']),
  skill('technical-problem-solving', 'problemSolving', { en: 'Technical problem solving', ms: 'Penyelesaian masalah teknikal' }, 'Diagnoses faults and fixes technical problems.', ['Lab troubleshooting', 'Maintenance internship'], ['Engineer', 'Technician'], 'high'),
  skill('engineering-design', 'problemSolving', { en: 'Engineering design', ms: 'Reka bentuk kejuruteraan' }, 'Designs a system or component to a specification.', ['Capstone design', 'Circuit design'], ['Graduate Engineer'], 'high'),
  skill('lab-testing', 'problemSolving', { en: 'Laboratory & testing', ms: 'Makmal & pengujian' }, 'Runs tests safely and records results accurately.', ['Lab demonstrator', 'Testing internship'], ['Test Engineer', 'QA/QC Engineer']),
  skill('statistical-analysis', 'problemSolving', { en: 'Statistical analysis', ms: 'Analisis statistik' }, 'Applies statistics to test ideas.', ['SPSS project', 'Survey analysis'], ['Research Analyst', 'Data Analyst']),
]

export const TAXONOMY_VERSION: TaxonomyVersion = {
  version: '3.2',
  status: 'published',
  publishedAt: '2026-08-01',
  approvedBy: ['off-ai', 'off-sa'],
  changeNote: 'Added Social media content; split Data analysis and Data visualisation.',
}

export const MODEL_VERSION = 'skilltrans-1.4 (on-prem)'
export const RUBRIC_VERSION = 'rubric-2026.08'
