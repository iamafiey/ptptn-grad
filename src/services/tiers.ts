import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { BenefitId, PartnerRole, RepaymentStatus, RoleAccess, Tier, TierView } from '@/types/domain'
import { readDb } from './db'
import { delay } from './delay'

// Repayment standing → tier → benefits. Repayment data stays inside this module and the
// student's own Repayment screen. Job and employer surfaces only ever receive a RoleAccess.

const TODAY = new Date('2026-10-07')

function tierFor(status: RepaymentStatus, missed: number, restructured: boolean, s: ProgrammeSettings): Tier {
  if (status === 'grace') return s.tier.graceCountsAsTierA ? 'A' : 'B'
  if (restructured && s.tier.restructuredCountsAsTierA) return 'A'
  if (status === 'behind' && missed >= s.tier.missedPaymentsForTierB) return 'B'
  return 'A'
}

export function getTier(studentId: string, s: ProgrammeSettings): Tier {
  const acct = readDb().repayment[studentId]
  if (!acct) return 'A'
  return tierFor(acct.status, acct.missedCount, acct.method === 'restructured', s)
}

export function buildTierView(studentId: string, s: ProgrammeSettings): TierView {
  const acct = readDb().repayment[studentId]
  const tier = getTier(studentId, s)
  const b = (id: BenefitId, a: TierView['benefits'][number]['state'], bState: TierView['benefits'][number]['state']) => ({ id, state: tier === 'A' ? a : bState })
  const benefits: TierView['benefits'] = [
    b('openJobs', 'unlocked', 'unlocked'),
    // Tier B: premium roles are paused (with an early-access window, older roles still show).
    b('partnerRoles', 'unlocked', 'paused'),
    b('courses', 'unlocked', s.tierB.courses === 'freeOnly' ? 'paused' : 'preview'),
    b('profileBoost', 'unlocked', 'paused'),
    b('coaching', 'unlocked', 'paused'),
  ]
  // Courses in Tier B are free + previews: partly available, so not counted as paused.
  return { tier, status: acct?.status ?? 'goodStanding', benefits, pausedCount: benefits.filter((x) => x.state === 'paused').length }
}

/** Async API shape for screens. */
export function getTierView(studentId: string, s: ProgrammeSettings) {
  return delay(buildTierView(studentId, s), 120)
}

/**
 * The only tier-derived value a job surface sees.
 * Tier B: 'hidden' when the setting hides partner roles; otherwise roles open up once
 * they are older than the early-access window, and are locked before that.
 */
export function roleAccess(studentId: string, role: PartnerRole, s: ProgrammeSettings): RoleAccess {
  if (getTier(studentId, s) === 'A') return 'full'
  if (s.tierB.partnerRoles === 'hidden') return 'hidden'
  const ageDays = (TODAY.getTime() - new Date(role.postedAt).getTime()) / 86_400_000
  return ageDays >= s.tierB.earlyAccessDays ? 'full' : 'locked'
}

/**
 * Course access by tier (spec: Tier B gets free courses plus first-module previews of premium courses).
 * 'preview' = can start, but only module 1. Driven by each course's tierAccess and the tierB.courses setting.
 */
export function courseAccess(studentId: string, course: import('@/types/domain').Course, s: ProgrammeSettings): 'full' | 'preview' | 'locked' {
  if (getTier(studentId, s) === 'A') return 'full'
  if (course.cost === 'free' || course.tierAccess === 'all') return 'full'
  if (course.tierAccess === 'tierAOnly') return 'locked'
  return s.tierB.courses === 'freePlusPreviews' ? 'preview' : 'locked'
}
