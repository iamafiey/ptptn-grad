import type { OpenJob, PartnerRole, ScoredSkill, SkillLevel } from '@/types/domain'
import { employerVisibleSkills } from './profile'

// Deterministic matching: required skills vs the student's employer-visible skills.
const RANK: Record<SkillLevel, number> = { foundation: 1, working: 2, advanced: 3 }

export interface SkillMatch {
  skillId: string
  required: SkillLevel
  has: SkillLevel | null
  met: boolean
}

export function matchRole(role: Pick<PartnerRole, 'requiredSkills'>, skills: ScoredSkill[]) {
  const mine = new Map(employerVisibleSkills(skills).map((s) => [s.skillId, s.level]))
  const detail: SkillMatch[] = role.requiredSkills.map((r) => {
    const has = mine.get(r.skillId) ?? null
    return { skillId: r.skillId, required: r.level, has, met: !!has && RANK[has] >= RANK[r.level] }
  })
  const credit = detail.reduce((sum, d) => {
    if (!d.has) return sum
    const gap = RANK[d.required] - RANK[d.has]
    return sum + (gap <= 0 ? 1 : gap === 1 ? 0.6 : 0.3)
  }, 0)
  const pct = detail.length ? Math.round(40 + (credit / detail.length) * 58) : 0
  return { pct: detail.some((d) => d.has) ? pct : Math.min(pct, 35), detail }
}

/** Open jobs list skills without levels: any level meets it, but stronger levels score higher. */
const JOB_CREDIT: Record<SkillLevel, number> = { foundation: 0.55, working: 0.8, advanced: 1 }
export function matchJob(job: Pick<OpenJob, 'skillIds'>, skills: ScoredSkill[]) {
  const base = matchRole({ requiredSkills: job.skillIds.map((skillId) => ({ skillId, level: 'foundation' as const })) }, skills)
  const credit = base.detail.reduce((sum, d) => sum + (d.has ? JOB_CREDIT[d.has] : 0), 0)
  const pct = base.detail.length ? Math.round(36 + (credit / base.detail.length) * 60) : 0
  return { pct: base.detail.some((d) => d.has) ? pct : Math.min(pct, 35), detail: base.detail }
}

/**
 * The gap that blocks the most matches: a skill the student lacks (or holds below the required level)
 * across partner roles and open jobs. "Unlocks N more matches" counts those listings.
 */
export function rankedGaps(skills: ScoredSkill[], roles: PartnerRole[], jobs: OpenJob[]) {
  const counts = new Map<string, { n: number; target: SkillLevel }>()
  const bump = (id: string, target: SkillLevel) => {
    const cur = counts.get(id)
    counts.set(id, { n: (cur?.n ?? 0) + 1, target: cur && RANK[cur.target] > RANK[target] ? cur.target : target })
  }
  // Only listings that already fit reasonably (50%+) count, so the gap is relevant to this student.
  for (const r of roles) {
    const m = matchRole(r, skills)
    if (m.pct >= 50) for (const d of m.detail) if (!d.met) bump(d.skillId, d.required)
  }
  for (const j of jobs) {
    const m = matchJob(j, skills)
    if (m.pct >= 50) for (const d of m.detail) if (!d.met) bump(d.skillId, 'working')
  }
  const mine = new Map(employerVisibleSkills(skills).map((s) => [s.skillId, s.level]))
  return [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))
    .map(([skillId, v]) => ({ skillId, currentLevel: mine.get(skillId) ?? null, targetLevel: v.target, unlocksMatches: v.n }))
}

export function topGap(skills: ScoredSkill[], roles: PartnerRole[], jobs: OpenJob[]) {
  return rankedGaps(skills, roles, jobs)[0] ?? null
}
