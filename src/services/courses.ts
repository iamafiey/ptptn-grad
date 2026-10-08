import type { ProgrammeSettings } from '@/config/programmeSettings'
import { PROVIDERS } from '@/data/courses'
import type { Course, Enrolment, Provider, RescoreResult, SkillLevel } from '@/types/domain'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { buildOpenJobs } from './jobs'
import { matchJob, matchRole } from './matching'
import { courseAccess } from './tiers'
import { asset } from '@/lib/asset'

// Learn: every course names the gap it closes and the roles it opens (docs §Learn).

export type CourseAccess = 'full' | 'preview' | 'locked'

export interface EnrolmentView extends Enrolment {
  course: Course
  provider: Provider
}

export interface CourseView extends Course {
  provider: Provider
  access: CourseAccess
  enrolment?: Enrolment
}

const TODAY = new Date('2026-10-07')
const LEVELS: SkillLevel[] = ['foundation', 'working', 'advanced']
/** Hosted courses advance one module per "Continue"; previews stop after module 1. */
export const MODULES = 3
export const PREVIEW_PCT = Math.round(100 / MODULES)

const providerOf = (id: string) => PROVIDERS.find((p) => p.id === id)!
const courses = () => readDb().courses

export function buildEnrolments(studentId: string): EnrolmentView[] {
  return (readDb().enrolments[studentId] ?? []).map((e) => {
    const course = courses().find((c) => c.id === e.courseId)!
    return { ...e, course, provider: providerOf(course.providerId) }
  })
}

export function listEnrolments(studentId: string) {
  return delay(buildEnrolments(studentId), 140)
}

/** Courses that close a given skill gap, free first. */
export function coursesForSkill(skillId: string): (Course & { provider: Provider })[] {
  const order = { free: 0, subsidised: 1, paid: 2 }
  return courses().filter((c) => c.status === 'live' && c.skillIds.includes(skillId))
    .sort((a, b) => order[a.cost] - order[b.cost])
    .map((c) => ({ ...c, provider: providerOf(c.providerId) }))
}

export function buildCatalogue(studentId: string, s: ProgrammeSettings): CourseView[] {
  const enr = readDb().enrolments[studentId] ?? []
  return courses().filter((c) => c.status === 'live').map((c) => ({ ...c, provider: providerOf(c.providerId), access: courseAccess(studentId, c, s), enrolment: enr.find((e) => e.courseId === c.id) }))
}

export function getCourse(studentId: string, courseId: string, s: ProgrammeSettings) {
  return buildCatalogue(studentId, s).find((c) => c.id === courseId)
}

/** Days since last activity, for the "nudge after 5 days inactive" rule. */
export function daysInactive(e: Enrolment) {
  return Math.floor((TODAY.getTime() - new Date(e.lastActivityAt).getTime()) / 86_400_000)
}

export async function enrol(studentId: string, courseId: string) {
  const course = courses().find((c) => c.id === courseId)!
  writeDb((d) => {
    const list = (d.enrolments[studentId] ??= [])
    if (list.some((e) => e.courseId === courseId)) return
    list.push({ courseId, studentId, status: course.hosted ? 'inProgress' : 'external', progressPct: 0, lastActivityAt: '2026-10-07' })
  })
  return delay(true, 350)
}

/** Complete the next module. Returns the new progress; previews cap at module 1. */
export async function continueCourse(studentId: string, courseId: string, access: CourseAccess) {
  let pct = 0
  writeDb((d) => {
    const e = d.enrolments[studentId].find((x) => x.courseId === courseId)!
    const cap = access === 'preview' ? PREVIEW_PCT : 100
    e.progressPct = Math.min(cap, e.progressPct + PREVIEW_PCT + (e.progressPct + PREVIEW_PCT >= 99 ? 1 : 0))
    if (e.progressPct >= 99) e.progressPct = 100
    e.lastActivityAt = '2026-10-07'
    pct = e.progressPct
  })
  return delay(pct, 500)
}

function strongMatches(studentId: string) {
  const d = readDb()
  const skills = d.students[studentId]?.skills ?? []
  const roles = d.partnerRoles.filter((r) => r.status === 'live').filter((r) => matchRole(r, skills).pct >= 80).length
  // Settings only affect which portals feed; any feed portal list is fine for counting.
  const jobs = buildOpenJobs(studentId, { portals: {} } as ProgrammeSettings).filter((j) => matchJob(j, skills).pct >= 80).length
  return roles + jobs
}

/**
 * Complete a course: its certificate is attached to the mapped skill as verified evidence and the
 * skill is re-scored (one level up, capped by the course's level cap). New matches are counted for real.
 */
export async function completeCourse(studentId: string, courseId: string): Promise<RescoreResult> {
  const course = courses().find((c) => c.id === courseId)!
  const before = strongMatches(studentId)
  const rec = readDb().students[studentId]
  const skillId = course.skillIds.find((id) => {
    const s = rec.skills?.find((x) => x.skillId === id)
    return !s || LEVELS.indexOf(s.level) < LEVELS.indexOf(course.levelCap)
  }) ?? course.skillIds[0]
  const current = rec.skills?.find((x) => x.skillId === skillId)
  const from = current?.level ?? null
  const capIdx = LEVELS.indexOf(course.levelCap)
  const to: SkillLevel = from ? LEVELS[Math.min(capIdx, LEVELS.indexOf(from) + 1)] : LEVELS[Math.min(capIdx, 1)]
  const evId = `${studentId}-cert-${courseId}`

  writeDb((d) => {
    const r = d.students[studentId]
    r.evidence.push({ id: evId, kind: 'certificate', fileName: `${course.title.en}.pdf`, previewUrl: asset('evidence/certificate.svg'), uploadedAt: '2026-10-07' })
    r.skills ??= []
    const sk = r.skills.find((x) => x.skillId === skillId)
    if (sk) {
      sk.level = to
      sk.evidenceIds = [...sk.evidenceIds, evId]
      sk.confidence = Math.min(0.95, Number((sk.confidence + 0.06).toFixed(2)))
      sk.confidenceLabel = sk.confidence >= 0.8 ? 'high' : 'medium'
      sk.rubricHits = [...new Set([...sk.rubricHits, 'Verified course certificate'])]
      if (sk.status === 'studentAdded' || sk.status === 'loweredByStudent') sk.status = 'kept'
    } else {
      r.skills.push({ skillId, level: to, confidence: 0.82, confidenceLabel: 'high', evidenceIds: [evId], factIds: [], rationale: { en: `Completed ${course.title.en} with a verified certificate.`, ms: `Menamatkan ${course.title.ms ?? course.title.en} dengan sijil disahkan.` }, rubricHits: ['Verified course certificate'], status: 'kept' })
    }
    const e = d.enrolments[studentId].find((x) => x.courseId === courseId)!
    e.status = 'completed'
    e.progressPct = 100
    e.certificateEvidenceId = evId
    d.notifications.unshift({ id: `n-${evId}`, studentId, type: 'rescored', channel: ['inApp'], body: { en: `${skillId.replace(/-/g, ' ')} moved up after your certificate.`, ms: `Kemahiran anda naik selepas sijil anda.` }, at: '2026-10-07T11:00:00+08:00', read: false, link: '/s/profile' })
  })
  const after = strongMatches(studentId)
  return delay({ skillId, from: from ?? 'foundation', to, newMatches: Math.max(0, after - before), reason: { en: 'Certificate attached to your skill as verified evidence.', ms: 'Sijil dilampirkan pada kemahiran anda sebagai bukti disahkan.' } }, 1400)
}
