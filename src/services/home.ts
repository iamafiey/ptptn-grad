import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { LocalizedText, ScoredSkill, SkillLevel } from '@/types/domain'
import { readDb } from './db'
import { delay } from './delay'
import { buildEnrolments, coursesForSkill } from './courses'
import { buildOpenJobs } from './jobs'
import { buildLog, buildSummary } from './jobLog'
import { topGap } from './matching'
import { buildRoleViews, partnerInterest } from './partners'
import { employerVisibleSkills } from './profile'
import { computeStrength } from './students'
import { buildTierView } from './tiers'

// One call for the Home feed, ordered by urgency (docs/student-dashboard-flow.md §Dashboard home).

export type NextStepKind = 'reply' | 'reupload' | 'benefits' | 'addEvidence' | 'threshold' | 'gap' | 'finishProfile'

export interface NextStep {
  kind: NextStepKind
  /** i18n key + vars; resolved in the UI. */
  vars: Record<string, string | number>
  link: string
}

const RANK: Record<SkillLevel, number> = { foundation: 1, working: 2, advanced: 3 }

export function buildHome(studentId: string, s: ProgrammeSettings) {
  const d = readDb()
  const rec = d.students[studentId]
  const strength = computeStrength(rec)
  const onboarded = rec.student.onboardingStep === 'done'
  const skills: ScoredSkill[] = rec.skills ?? []
  const tier = buildTierView(studentId, s)
  const roles = onboarded ? buildRoleViews(studentId, s) : []
  const invitations = roles.filter((r) => r.invitation && r.invitation.origin !== 'student' && (r.invitation.stage === 'invited' || r.invitation.stage === 'talking'))
  const waiting = invitations.filter((r) => r.invitation!.stage === 'invited')
  const jobs = onboarded ? buildOpenJobs(studentId, s) : []
  const log = buildLog(studentId)
  const summary = buildSummary(studentId, s)
  const gap = onboarded ? topGap(skills, d.partnerRoles.filter((r) => r.status === 'live'), jobs) : null
  const enrolments = buildEnrolments(studentId)
  const inProgress = enrolments.find((e) => e.status === 'inProgress')
  const recommended = gap ? coursesForSkill(gap.skillId)[0] : undefined
  const topSkills = [...employerVisibleSkills(skills)].sort((a, b) => RANK[b.level] - RANK[a.level] || b.confidence - a.confidence).slice(0, 5)
  const acct = d.repayment[studentId]

  // Single most urgent action.
  const rejected = log.filter((e) => e.status === 'rejected')
  const pending = log.filter((e) => e.status === 'pendingEvidence')
  let next: NextStep
  if (!onboarded) next = { kind: 'finishProfile', vars: {}, link: '' }
  else if (waiting.length) next = { kind: 'reply', vars: { date: waiting[0].invitation!.replyBy }, link: `/s/opportunities?tab=partner&invite=${waiting[0].invitation!.id}` }
  else if (rejected.length) next = { kind: 'reupload', vars: { count: rejected.length }, link: `/s/opportunities?tab=log&entry=${rejected[0].id}` }
  else if (tier.tier === 'B') next = { kind: 'benefits', vars: { count: tier.pausedCount }, link: '/s/repayment' }
  else if (pending.length) next = { kind: 'addEvidence', vars: { count: pending.length }, link: `/s/opportunities?tab=log&entry=${pending[0].id}` }
  else if (!summary.met) next = { kind: 'threshold', vars: { count: summary.threshold - summary.verified }, link: '/s/opportunities?tab=log' }
  else next = { kind: 'gap', vars: {}, link: gap ? `/s/learn/gap/${gap.skillId}` : '/s/learn' }

  // Repayment standing for Home: status and dates only — never amounts, never "arrears".
  const standing = {
    status: acct?.status ?? 'goodStanding',
    tier: tier.tier,
    graceEndsAt: acct?.graceEndsAt,
    nextDueAt: acct?.nextPayment?.dueAt,
    unlocked: tier.benefits.filter((b) => b.state !== 'paused').length,
    total: tier.benefits.length,
    pausedCount: tier.pausedCount,
  }

  return {
    student: rec.student,
    strength,
    onboarded,
    next,
    interest: { ...partnerInterest(studentId), invitations: invitations.length },
    invitations,
    roles: roles.slice(0, 6),
    summary,
    jobs: jobs.slice(0, 4),
    topSkills,
    gap,
    learning: inProgress ? { kind: 'inProgress' as const, enrolment: inProgress } : recommended ? { kind: 'recommended' as const, course: recommended } : null,
    standing,
  }
}

export type HomeData = ReturnType<typeof buildHome>

export function getHome(studentId: string, s: ProgrammeSettings) {
  return delay(buildHome(studentId, s), 180)
}

export const HOME_TIPS: LocalizedText[] = [
  { en: 'Add a certificate or letter to your strongest skill.', ms: 'Tambah sijil atau surat pada kemahiran terkuat anda.' },
  { en: 'Close one skill gap with a free course.', ms: 'Tutup satu jurang kemahiran dengan kursus percuma.' },
  { en: 'Partners search by location: add more preferred states.', ms: 'Rakan kongsi mencari ikut lokasi: tambah lebih banyak negeri pilihan.' },
]
