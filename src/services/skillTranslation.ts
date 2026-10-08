import { MODEL_VERSION, RUBRIC_VERSION, TAXONOMY_VERSION } from '@/data/taxonomy'
import type {
  AcademicRecord,
  Activity,
  ActivityKind,
  ExtractedFact,
  RescoreResult,
  ScoredSkill,
  SkillLevel,
  SkillMapping,
  SkillTranslationResult,
  TranslationProgressEvent,
} from '@/types/domain'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { asset } from '@/lib/asset'

// Simulated AI skill translation (docs/student-dashboard-flow.md §Skill profile and AI translation):
// 1 Extract facts → 2 Map to the fixed taxonomy → 3 Score with the visible rubric → 4 Explain.
// Fully deterministic: the same activity always yields the same skills and levels.

const LEVELS: SkillLevel[] = ['foundation', 'working', 'advanced']
const fast = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast')

// ---------------------------------------------------------------- 1. Extract
const LEAD = /\b(lead|led|leader|exco|president|director|captain|head|treasurer|supervisor|chair|ketua|pengerusi|bendahari|managed|manager)\b/i

function monthsBetween(a: string, b?: string) {
  const s = new Date(a)
  const e = b ? new Date(b) : new Date('2026-10-07')
  return Math.max(1, Math.round((e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())))
}

/** Largest "scale" number in the text (people, items, RM), ignoring years and percentages. */
function scaleOf(text: string) {
  const nums = [...text.matchAll(/(RM\s?)?(\d{1,3}(?:,\d{3})+|\d+)(\s?%)?/g)]
    .filter((m) => !m[3])
    .map((m) => Number(m[2].replace(/,/g, '')))
    .filter((n) => !(n >= 1990 && n <= 2100))
  return nums.length ? Math.max(...nums) : 0
}

export function extractFacts(a: Activity): ExtractedFact {
  const text = `${a.description} ${a.outcome ?? ''}`
  const scale = scaleOf(text)
  return {
    id: `f-${a.id}`,
    sourceId: a.id,
    sourceType: 'activity',
    role: a.role,
    durationMonths: monthsBetween(a.startDate, a.endDate),
    scale: scale ? String(scale) : undefined,
    outcome: a.outcome,
  }
}

// ---------------------------------------------------------------- 2. Map (fixed rule table)
// Order matters only as a tie-break. Each rule id is reported in the mapping for explainability.
// `generic` rules (leading people, volunteering) rank after domain skills, so "Exco Logistik"
// maps to Logistics first and Team leadership second.
const RULES: { id: string; skillId: string; re: RegExp; generic?: boolean }[] = [
  { id: 'R01', skillId: 'logistics-coordination', re: /logisti|supply|supplies|distribut|bekalan|deliver/i },
  { id: 'R02', skillId: 'social-media', re: /instagram|tiktok|social media|content calendar|followers/i },
  { id: 'R03', skillId: 'digital-marketing', re: /campaign|digital marketing|ads\b|boosted|seo/i },
  { id: 'R04', skillId: 'sales', re: /\bsales\b|\bsell|seller|jualan|closed deals/i },
  { id: 'R05', skillId: 'customer-service', re: /customer|cashier|barista|served|front desk/i },
  { id: 'R06', skillId: 'inventory-management', re: /inventory|stock|warehouse|sku|gudang/i },
  { id: 'R07', skillId: 'volunteer-coordination', re: /volunteer|sukarelawan/i, generic: true },
  { id: 'R08', skillId: 'team-leadership', re: /\b(led|lead|leader|exco|captain|president|ketua|managed \d+)/i, generic: true },
  { id: 'R09', skillId: 'event-management', re: /\bevent|karnival|carnival|festival|fair\b|programme director|run-sheet/i },
  { id: 'R10', skillId: 'stakeholder-communication', re: /district office|donor|sponsor|stakeholder|agency|liais/i },
  { id: 'R11', skillId: 'fundraising', re: /fundrais|sponsorship|raised rm|donation/i },
  { id: 'R12', skillId: 'budgeting', re: /budget|treasurer|bendahari|accounts|rm\s?\d/i },
  { id: 'R13', skillId: 'public-speaking', re: /pitch|present|emcee|\bmc\b|speech|debate/i },
  { id: 'R14', skillId: 'report-writing', re: /report|newsletter|minutes|proposal|thesis/i },
  { id: 'R15', skillId: 'spreadsheet-modelling', re: /excel|spreadsheet|pivot|google sheets/i },
  { id: 'R16', skillId: 'data-analysis', re: /\bdata\b|analys|dashboard|insight/i },
  { id: 'R17', skillId: 'programming-python', re: /python|coding|script|programm/i },
  { id: 'R18', skillId: 'web-development', re: /website|web app|html|wordpress/i },
  { id: 'R19', skillId: 'market-research', re: /survey|market research|consumer|competitor/i },
  { id: 'R20', skillId: 'entrepreneurship', re: /business owner|own business|started a|online shop|startup|usahawan/i },
  { id: 'R21', skillId: 'research-methods', re: /research|study|final-year project|experiment/i },
  { id: 'R22', skillId: 'critical-thinking', re: /case (competition|challenge)|hackathon|problem|analysed a/i },
  { id: 'R23', skillId: 'engineering-design', re: /design(ed)? a|circuit|prototype|cad\b/i },
  { id: 'R24', skillId: 'lab-testing', re: /\blab\b|laborator|testing|tested/i },
  { id: 'R25', skillId: 'health-safety', re: /safety|hse|hazard/i },
  { id: 'R26', skillId: 'quality-control', re: /quality|\bqc\b|\bqa\b|inspect|defect/i },
  { id: 'R27', skillId: 'mentoring', re: /tutor|mentor|coach|trained \d|trained new|guided/i },
  { id: 'R28', skillId: 'scheduling', re: /schedul|roster|timeline|shift plan/i },
  { id: 'R29', skillId: 'procurement', re: /procure|supplier|tender|purchas|vendor/i },
  { id: 'R30', skillId: 'project-management', re: /project lead|managed the project|delivered on|milestone/i },
  { id: 'R31', skillId: 'negotiation', re: /negotiat/i },
  { id: 'R32', skillId: 'bilingual-communication', re: /bilingual|translat|english and (bahasa|bm)/i },
  { id: 'R33', skillId: 'statistical-analysis', re: /statistic|spss|regression/i },
  { id: 'R34', skillId: 'process-improvement', re: /optimis|cut .* time|reduced|improv/i },
]

const FALLBACK: Record<ActivityKind, string> = {
  club: 'team-leadership',
  partTime: 'customer-service',
  internship: 'project-management',
  competition: 'critical-thinking',
  freelance: 'entrepreneurship',
  coursework: 'research-methods',
  fyp: 'research-methods',
}

function mapActivity(a: Activity): { skillId: string; ruleId: string; primary: boolean }[] {
  const role = a.role
  const body = `${a.description} ${a.outcome ?? ''}`
  const hits = RULES.map((r) => {
    const inRole = role.search(r.re)
    const inBody = body.search(r.re)
    const pos = inRole >= 0 ? inRole - 10_000 : inBody
    return { r, pos: pos === -1 ? -1 : pos + (r.generic ? 20_000 : 0) }
  })
    .filter((h) => h.pos !== -1)
    .sort((x, y) => x.pos - y.pos)
  const unique = hits.filter((h, i) => hits.findIndex((o) => o.r.skillId === h.r.skillId) === i).slice(0, 3)
  if (!unique.length) return [{ skillId: FALLBACK[a.kind], ruleId: 'R00', primary: true }]
  return unique.map((h, i) => ({ skillId: h.r.skillId, ruleId: h.r.id, primary: i === 0 }))
}

// ---------------------------------------------------------------- 3. Score (visible rubric)
function scoreActivity(a: Activity, f: ExtractedFact, primary: boolean) {
  const months = f.durationMonths ?? 0
  const scale = Number(f.scale ?? 0)
  const lead = LEAD.test(a.role) || LEAD.test(a.description)
  const evidenced = a.evidenceIds.length > 0
  const graded = /grade (a|b)/i.test(a.outcome ?? '')
  const hits: string[] = []
  let points = 0
  const add = (p: number, hit: string) => {
    points += p
    hits.push(hit)
  }
  if (months >= 12) add(2, '12+ months of responsibility')
  else if (months >= 6) add(1.5, '6+ months of responsibility')
  if (lead) add(1, 'Lead role')
  if (scale >= 100) add(1, 'Scale of 100+')
  else if (scale >= 20) add(0.5, 'Outcome with scale')
  if (graded) add(1.5, 'Graded at B or above')
  if (evidenced && primary) add(1, 'Evidence attached')
  if (!primary) points -= 0.5

  let level: SkillLevel = points >= 1.5 ? 'working' : 'foundation'
  // Advanced needs every rubric gate: 12+ months, lead, scale 100+, evidence, and it must be the main skill.
  if (primary && months >= 12 && lead && scale >= 100 && evidenced) level = 'advanced'
  if (!hits.length) hits.push('Related activity')
  return { level, hits, lead, evidenced }
}

// ---------------------------------------------------------------- 4. Explain
function firstSentence(s: string) {
  const m = s.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : s).trim()
}

function rationaleFor(a: Activity, f: ExtractedFact, primary: boolean) {
  const months = f.durationMonths ?? 0
  if (primary) return { en: firstSentence(a.description) }
  return {
    en: `${a.role} at ${a.organisation}, ${months} month${months === 1 ? '' : 's'}.`,
    ms: `${a.role} di ${a.organisation}, ${months} bulan.`,
  }
}

const COURSE_RULES: { re: RegExp; skillId: string }[] = [
  { re: /digital marketing/i, skillId: 'digital-marketing' },
  { re: /consumer|marketing research/i, skillId: 'market-research' },
  { re: /statistic/i, skillId: 'statistical-analysis' },
  { re: /entrepreneur/i, skillId: 'entrepreneurship' },
  { re: /procure/i, skillId: 'procurement' },
  { re: /report writing/i, skillId: 'report-writing' },
]

/** Run the engine over activities + transcript. Pure and deterministic. */
export function runEngine(activities: Activity[], academic: AcademicRecord | null) {
  const facts: ExtractedFact[] = []
  const mappings: SkillMapping[] = []
  const bySkill = new Map<string, ScoredSkill>()

  const merge = (next: ScoredSkill) => {
    const prev = bySkill.get(next.skillId)
    if (!prev) return bySkill.set(next.skillId, next)
    const better = LEVELS.indexOf(next.level) > LEVELS.indexOf(prev.level) ? next : prev
    bySkill.set(next.skillId, {
      ...better,
      evidenceIds: [...new Set([...prev.evidenceIds, ...next.evidenceIds])],
      factIds: [...new Set([...prev.factIds, ...next.factIds])],
      rubricHits: [...new Set([...prev.rubricHits, ...next.rubricHits, 'Two independent sources'])],
      confidence: Number(Math.min(0.95, Math.max(prev.confidence, next.confidence) + 0.05).toFixed(2)),
    })
  }

  for (const a of activities) {
    const f = extractFacts(a)
    facts.push(f)
    for (const m of mapActivity(a)) {
      mappings.push({ factId: f.id, skillId: m.skillId, ruleId: m.ruleId })
      const s = scoreActivity(a, f, m.primary)
      const confidence = Math.min(0.95, 0.58 + (s.evidenced ? 0.14 : 0) + (s.lead ? 0.06 : 0) + Math.min(0.12, a.description.length / 900) + (m.primary ? 0.05 : 0))
      merge({
        skillId: m.skillId,
        level: s.level,
        confidence: Number(confidence.toFixed(2)),
        confidenceLabel: confidence >= 0.8 ? 'high' : confidence >= 0.65 ? 'medium' : 'low',
        evidenceIds: [a.id, ...(m.primary ? a.evidenceIds : [])],
        factIds: [f.id],
        rationale: rationaleFor(a, f, m.primary),
        rubricHits: s.hits,
        status: 'kept',
      })
    }
  }

  for (const c of academic?.courses ?? []) {
    const rule = COURSE_RULES.find((r) => r.re.test(c.name))
    if (!rule) continue
    const fid = `f-course-${c.code}`
    facts.push({ id: fid, sourceId: c.code, sourceType: 'transcript', role: c.name, outcome: `Grade ${c.grade}` })
    mappings.push({ factId: fid, skillId: rule.skillId, ruleId: 'T01' })
    merge({
      skillId: rule.skillId,
      level: 'foundation',
      confidence: 0.7,
      confidenceLabel: 'medium',
      evidenceIds: ['transcript'],
      factIds: [fid],
      rationale: { en: `Completed ${c.name} (${c.grade}).`, ms: `Lulus ${c.name} (${c.grade}).` },
      rubricHits: ['Related course'],
      status: 'kept',
    })
  }

  const skills = [...bySkill.values()].sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || b.confidence - a.confidence)
  return { facts, mappings, skills }
}

// ---------------------------------------------------------------- Service API

/** Total simulated duration of a translation run (spec: 10–20 s). `?fast=1` shortens it for rehearsals. */
export const TRANSLATION_MS = fast ? 2500 : 12000

/**
 * Translate a student's records into skills, emitting staged progress like a streaming API.
 * Students with a stored result (finished onboarding) get that result back unchanged.
 */
export async function translateSkills(
  studentId: string,
  onProgress: (e: TranslationProgressEvent) => void,
  opts: { skip?: () => boolean } = {},
): Promise<SkillTranslationResult> {
  const rec = readDb().students[studentId]
  const n = rec.activities.length
  const courses = rec.academic?.courses.length ?? 0
  const stages: TranslationProgressEvent[] = [
    { stage: 'reading', pct: 12, message: { en: 'Reading your transcript…', ms: 'Membaca transkrip anda…' } },
    { stage: 'extracting', pct: 34, message: { en: `Extracting facts from ${n} activities and ${courses} courses…`, ms: `Mengekstrak fakta daripada ${n} aktiviti dan ${courses} kursus…` } },
    { stage: 'mapping', pct: 58, message: { en: `Mapping ${n} activities to skills…`, ms: `Memetakan ${n} aktiviti kepada kemahiran…` } },
    { stage: 'scoring', pct: 80, message: { en: 'Scoring each skill against the rubric…', ms: 'Menilai setiap kemahiran berdasarkan rubrik…' } },
    { stage: 'explaining', pct: 96, message: { en: 'Writing a plain-language reason for each skill…', ms: 'Menulis sebab ringkas untuk setiap kemahiran…' } },
  ]
  const step = TRANSLATION_MS / stages.length
  for (const s of stages) {
    onProgress(s)
    // Wait in small slices so a presenter's "Skip" takes effect immediately.
    for (let waited = 0; waited < step && !opts.skip?.(); waited += 100) await new Promise((r) => setTimeout(r, 100))
  }

  const stored = rec.skills
  const { facts, mappings, skills } = runEngine(rec.activities, rec.academic)
  const finalSkills = stored ?? skills

  writeDb((d) => {
    const s = d.students[studentId]
    s.skills = finalSkills
    for (const a of s.activities) a.skillIds = mappings.filter((m) => m.factId === `f-${a.id}`).map((m) => m.skillId)
    if (s.student.onboardingStep !== 'done') s.student.onboardingStep = 'reveal'
  })

  return {
    requestId: `tr-${studentId}-${rec.activities.length}`,
    studentId,
    modelVersion: MODEL_VERSION,
    rubricVersion: RUBRIC_VERSION,
    taxonomyVersion: TAXONOMY_VERSION.version,
    generatedAt: '2026-10-07T10:42:00+08:00',
    durationMs: TRANSLATION_MS,
    facts,
    mappings,
    skills: finalSkills,
    stats: { activitiesRead: rec.activities.length, skillsFound: finalSkills.length },
  }
}

export type EvidenceSampleKind = 'certificate' | 'letter' | 'photo'

/**
 * Adding evidence triggers a re-score. Certificates and letters lift the level one step
 * (never above Advanced); a photo only raises confidence. Students can never raise a level without evidence.
 */
export async function addEvidenceAndRescore(studentId: string, skillId: string, kind: EvidenceSampleKind): Promise<RescoreResult> {
  const rec = readDb().students[studentId]
  const current = rec.skills?.find((s) => s.skillId === skillId)
  if (!current) throw new Error('Unknown skill')
  const from = current.level
  const idx = LEVELS.indexOf(from)
  const lifts = kind !== 'photo' && idx < 2
  const to = lifts ? LEVELS[idx + 1] : from
  const evId = `${studentId}-e${rec.evidence.length + 1}`
  const newMatches = lifts ? 3 + (skillId.length % 7) : 0

  writeDb((d) => {
    const s = d.students[studentId]
    s.evidence.push({
      id: evId,
      kind,
      fileName: kind === 'certificate' ? 'Certificate.pdf' : kind === 'letter' ? 'Reference-letter.pdf' : 'Photo.jpg',
      previewUrl: asset(`evidence/${kind === 'photo' ? 'photo' : kind}.svg`),
      uploadedAt: '2026-10-07',
    })
    const sk = s.skills!.find((x) => x.skillId === skillId)!
    sk.evidenceIds = [...sk.evidenceIds, evId]
    sk.level = to
    sk.confidence = Math.min(0.95, Number((sk.confidence + 0.08).toFixed(2)))
    sk.confidenceLabel = sk.confidence >= 0.8 ? 'high' : sk.confidence >= 0.65 ? 'medium' : 'low'
    sk.rubricHits = [...new Set([...sk.rubricHits, 'Evidence attached'])]
    if (sk.status === 'loweredByStudent' || sk.status === 'studentAdded') sk.status = 'kept'
    delete sk.studentLevelCap
  })

  return delay(
    {
      skillId,
      from,
      to,
      newMatches,
      reason: lifts
        ? { en: 'New evidence meets the next rubric level.', ms: 'Bukti baharu memenuhi tahap rubrik seterusnya.' }
        : { en: 'Evidence added. Confidence is now higher; the level needs a certificate or letter to change.', ms: 'Bukti ditambah. Keyakinan meningkat; tahap memerlukan sijil atau surat untuk berubah.' },
    },
    1600,
  )
}
