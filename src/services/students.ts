import type { AcademicRecord, Activity, ActivityKind, EvidenceFile, JobPreferences, OnboardingStep, ScoredSkill, SkillLevel, Student } from '@/types/domain'
import type { StudentSeed } from '@/data/students'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { asset } from '@/lib/asset'

export interface StudentState extends StudentSeed {
  strength: ProfileStrength
}

export interface ProfileStrength {
  pct: number
  /** Items not yet done, used for the setup checklist and "Skip for now" cost. */
  missing: { id: 'record' | 'transcript' | 'activities' | 'evidence' | 'preferences' | 'review' | 'visible'; points: number }[]
}

const LEVELS: SkillLevel[] = ['foundation', 'working', 'advanced']

/** Profile strength: what's filled in, weighted. Same inputs → same number. */
export function computeStrength(s: StudentSeed): ProfileStrength {
  const st = s.student
  const after = (step: OnboardingStep) => {
    const order: OnboardingStep[] = ['signin', 'consent', 'confirm', 'academic', 'activities', 'preferences', 'translating', 'reveal', 'review', 'visible', 'done']
    return order.indexOf(st.onboardingStep) > order.indexOf(step)
  }
  const items: { id: ProfileStrength['missing'][number]['id']; points: number; done: boolean }[] = [
    { id: 'record', points: 15, done: after('confirm') },
    { id: 'transcript', points: 15, done: !!s.academic },
    { id: 'activities', points: 25, done: s.activities.length >= 3 },
    { id: 'evidence', points: 15, done: s.evidence.filter((e) => e.kind !== 'transcript').length >= 2 },
    { id: 'preferences', points: 10, done: st.preferences.roleInterests.length > 0 },
    { id: 'review', points: 10, done: after('review') },
    { id: 'visible', points: 10, done: st.onboardingStep === 'done' && st.visibility.partnersCanFind },
  ]
  // Partial credit for activities so each one added moves the meter.
  const actPartial = Math.min(3, s.activities.length) * 8
  const pct = items.reduce((sum, i) => sum + (i.done ? i.points : i.id === 'activities' ? actPartial : 0), 0)
  return { pct: Math.min(100, pct), missing: items.filter((i) => !i.done).map(({ id, points }) => ({ id, points })) }
}

function rec(id: string) {
  return readDb().students[id]
}

export async function getStudentState(id: string): Promise<StudentState> {
  const r = structuredClone(rec(id))
  return delay({ ...r, strength: computeStrength(r) }, 120)
}

export async function setOnboardingStep(id: string, step: OnboardingStep) {
  writeDb((d) => {
    d.students[id].student.onboardingStep = step
    if (step === 'done') d.students[id].student.stage = 'visible'
  })
  return delay(true, 60)
}

export async function updateStudent(id: string, patch: Partial<Pick<Student, 'institution' | 'programme' | 'graduationYear' | 'cgpaBand' | 'summary'>>) {
  writeDb((d) => Object.assign(d.students[id].student, patch))
  return delay(true, 150)
}

export async function recordConsent(id: string, version: string) {
  writeDb((d) => (d.students[id].student.consent = { version, agreedAt: '2026-10-07' }))
  return delay(true, 300)
}

/** Simulated transcript extraction. Uses the student's record if seeded, otherwise a sample. */
export async function uploadTranscript(id: string, fileName: string): Promise<AcademicRecord> {
  const r = rec(id)
  const academic: AcademicRecord = r.academic ?? {
    studentId: id,
    source: 'upload',
    courses: [
      { code: 'BUS101', name: 'Principles of Management', grade: 'B+' },
      { code: 'STA201', name: 'Business Statistics', grade: 'B' },
    ],
  }
  writeDb((d) => {
    d.students[id].academic = academic
    d.students[id].evidence = d.students[id].evidence.filter((e) => e.kind !== 'transcript')
    d.students[id].evidence.push({ id: `${id}-t`, kind: 'transcript', fileName, previewUrl: asset('evidence/transcript.svg'), uploadedAt: '2026-10-07' })
  })
  return delay(structuredClone(academic), 2200)
}

export interface ActivityInput {
  kind: ActivityKind
  organisation: string
  role: string
  months: number
  description: string
  outcome?: string
  evidence?: 'certificate' | 'letter' | 'photo' | null
}

export async function addActivity(id: string, input: ActivityInput): Promise<Activity> {
  const r = rec(id)
  const n = r.activities.length + 1
  const end = new Date('2026-09-01')
  const start = new Date(end)
  start.setMonth(start.getMonth() - Math.max(1, input.months))
  const evidence: EvidenceFile | null = input.evidence
    ? { id: `${id}-ev${n}`, kind: input.evidence, fileName: `${input.evidence}.pdf`, previewUrl: asset(`evidence/${input.evidence}.svg`), uploadedAt: '2026-10-07' }
    : null
  const activity: Activity = {
    id: `${id}-a${n}-${Date.now() % 100000}`,
    studentId: id,
    kind: input.kind,
    organisation: input.organisation.trim(),
    role: input.role.trim(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    description: input.description.trim(),
    outcome: input.outcome?.trim() || undefined,
    evidenceIds: evidence ? [evidence.id] : [],
    skillIds: [],
  }
  writeDb((d) => {
    d.students[id].activities.push(activity)
    if (evidence) d.students[id].evidence.push(evidence)
    // New input invalidates any stored live result; seeded results for finished students are kept.
    if (d.students[id].student.onboardingStep !== 'done') d.students[id].skills = null
  })
  return delay(activity, 200)
}

export async function removeActivity(id: string, activityId: string) {
  writeDb((d) => {
    d.students[id].activities = d.students[id].activities.filter((a) => a.id !== activityId)
  })
  return delay(true, 100)
}

export async function savePreferences(id: string, prefs: JobPreferences) {
  writeDb((d) => (d.students[id].student.preferences = prefs))
  return delay(true, 200)
}

// ---------------------------------------------------------------- Skill review actions

function editSkill(id: string, skillId: string, fn: (s: ScoredSkill) => void) {
  writeDb((d) => {
    const s = d.students[id].skills?.find((x) => x.skillId === skillId)
    if (s) fn(s)
  })
}

export async function keepSkill(id: string, skillId: string) {
  editSkill(id, skillId, (s) => {
    if (s.status === 'hidden') s.status = 'kept'
  })
  return delay(true, 60)
}

/** Students may lower a level, never raise it without new evidence. */
export async function lowerSkill(id: string, skillId: string) {
  editSkill(id, skillId, (s) => {
    const i = LEVELS.indexOf(s.level)
    if (i > 0) {
      s.level = LEVELS[i - 1]
      s.studentLevelCap = s.level
      s.status = 'loweredByStudent'
    }
  })
  return delay(true, 80)
}

export async function hideSkill(id: string, skillId: string) {
  editSkill(id, skillId, (s) => (s.status = 'hidden'))
  return delay(true, 60)
}

export async function unhideSkill(id: string, skillId: string) {
  editSkill(id, skillId, (s) => (s.status = 'kept'))
  return delay(true, 60)
}

/** "This isn't right": hidden from employers immediately and sent to the AI governance queue. */
export async function disputeSkill(id: string, skillId: string, reason: string, comment: string) {
  editSkill(id, skillId, (s) => {
    s.status = 'disputed'
    s.rubricHits = [...s.rubricHits]
  })
  return delay({ caseId: `SD-${2000 + skillId.length * 37}`, reason, comment }, 500)
}

/** A student-added skill starts at Foundation with low confidence until evidence is attached. */
export async function addMissingSkill(id: string, skillId: string) {
  writeDb((d) => {
    const r = d.students[id]
    r.skills ??= []
    if (r.skills.some((s) => s.skillId === skillId)) return
    r.skills.push({
      skillId,
      level: 'foundation',
      confidence: 0.5,
      confidenceLabel: 'low',
      evidenceIds: [],
      factIds: [],
      rationale: { en: 'Added by you. Attach evidence to raise the level.', ms: 'Ditambah oleh anda. Lampirkan bukti untuk menaikkan tahap.' },
      rubricHits: [],
      status: 'studentAdded',
    })
  })
  return delay(true, 120)
}

export async function setVisibility(id: string, on: boolean) {
  writeDb((d) => (d.students[id].student.visibility = { partnersCanFind: on, pausedReason: on ? undefined : 'student' }))
  return delay(true, 120)
}

/** Where the student app opens: Home once onboarding is done, otherwise the step they reached. */
export function studentHomePath(id: string): string {
  const step = readDb().students[id]?.student.onboardingStep ?? 'done'
  if (step === 'done') return '/s/home'
  return `/s/onboarding/${step === 'translating' ? 'preferences' : step}`
}

/** Sync read of the live store: does this student have translated skills yet? (Avoids acting on stale hook data.) */
export function hasSkills(id: string): boolean {
  return !!readDb().students[id]?.skills
}
