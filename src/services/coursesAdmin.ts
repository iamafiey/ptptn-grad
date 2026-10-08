import { PROVIDERS } from '@/data/courses'
import { OPEN_JOBS } from '@/data/jobs'
import type { Course, Officer, SkillLevel } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { listSkills } from './taxonomy'

// Learn catalogue management: every course maps to at least one taxonomy skill.

export function listCatalogueAdmin() {
  return delay({ courses: readDb().courses, providers: PROVIDERS }, 120)
}

/** AI-suggested skill mappings from a syllabus (deterministic keyword match against the taxonomy). */
export function suggestSkills(text: string) {
  const t = text.toLowerCase()
  return listSkills()
    .map((s) => {
      const terms = [s.name.en, ...s.exampleActivities, ...s.definition.en.split(/[ ,.]+/).filter((w) => w.length > 6)].map((x) => x.toLowerCase())
      const hits = terms.filter((x) => t.includes(x)).length + (t.includes(s.name.en.toLowerCase()) ? 2 : 0)
      return { skillId: s.id, score: hits }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => ({ skillId: x.skillId, confidence: Math.min(0.95, 0.55 + x.score * 0.12) }))
}

export interface CourseDraft {
  title: string
  providerId: string
  skillIds: string[]
  levelCap: SkillLevel
  durationHours: number
  cost: Course['cost']
  costRM?: number
  format: Course['format']
  tierAccess: Course['tierAccess']
  certificate: string
}

export async function addCourse(officer: Officer, draft: CourseDraft) {
  const id = `c-new-${readDb().courses.length + 1}`
  writeDb((d) =>
    d.courses.push({
      id,
      providerId: draft.providerId,
      title: { en: draft.title, ms: draft.title },
      skillIds: draft.skillIds,
      levelCap: draft.levelCap,
      durationHours: draft.durationHours,
      cost: draft.cost,
      costRM: draft.cost === 'free' ? undefined : draft.costRM,
      format: draft.format,
      hosted: true,
      certificate: draft.certificate,
      tierAccess: draft.tierAccess,
      status: 'live',
      enrolments: 0,
      completionRate: 0,
      thumbnail: 'thumbnails/default.svg',
    }),
  )
  logAudit(officer, 'Published course', 'course', id, `${draft.title} → ${draft.skillIds.join(', ')}`)
  return delay(id, 300)
}

export async function setCourseStatus(officer: Officer, id: string, status: Course['status']) {
  writeDb((d) => (d.courses.find((c) => c.id === id)!.status = status))
  logAudit(officer, `Course ${status}`, 'course', id)
  return delay(true, 150)
}

/** Skills that most often block matches, with course coverage; uncovered high-demand skills are flagged. */
export function gapInsights() {
  const d = readDb()
  const demand = new Map<string, number>()
  for (const r of d.partnerRoles.filter((x) => x.status === 'live')) for (const s of r.requiredSkills) demand.set(s.skillId, (demand.get(s.skillId) ?? 0) + 3)
  for (const j of OPEN_JOBS) for (const s of j.skillIds) demand.set(s, (demand.get(s) ?? 0) + 1)
  return [...demand.entries()]
    .map(([skillId, score]) => {
      const courses = d.courses.filter((c) => c.status === 'live' && c.skillIds.includes(skillId)).length
      const skill = listSkills().find((s) => s.id === skillId)!
      return { skillId, score, courses, highDemand: skill.demand === 'high' || score >= 6, uncovered: courses === 0 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}
