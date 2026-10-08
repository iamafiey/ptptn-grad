import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { Officer } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb, type ChangeRequest } from './db'
import { delay } from './delay'

// Two-person rule for rubric and tier-rule changes: draft → impact preview → second approver → publish.

export type ImpactRow = {
  group: string
  up: number
  down: number
  unchanged: number
}

export interface RubricImpact {
  sample: number
  up: number
  down: number
  unchanged: number
  byInstitution: ImpactRow[]
  byProgramme: ImpactRow[]
  notified: number
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17)

/** Deterministic preview over a 500-profile sample. Known example rules have hand-checked numbers. */
export function rubricImpact(ruleText: string): RubricImpact {
  const exco = /exco/i.test(ruleText) && /6 months/i.test(ruleText)
  const h = hash(ruleText)
  const down = exco ? 38 : 5 + (h % 30)
  const up = exco ? 0 : (h >> 3) % 12
  const split = (n: number, parts: number[]) => parts.map((p) => Math.round((n * p) / 100))
  const instDown = split(down, [55, 18, 18, 9])
  const instUp = split(up, [55, 18, 18, 9])
  const inst = ['Public university', 'Private university', 'Polytechnic', 'Community college']
  const instTotal = [300, 80, 80, 40]
  const prog = ['Business & marketing', 'Engineering', 'Logistics & operations', 'Computing', 'Social science']
  const progTotal = [130, 110, 80, 100, 80]
  const progDown = split(down, [36, 12, 26, 8, 18])
  const progUp = split(up, [30, 20, 20, 15, 15])
  return {
    sample: 500,
    up,
    down,
    unchanged: 500 - up - down,
    byInstitution: inst.map((g, i) => ({ group: g, up: instUp[i], down: instDown[i], unchanged: instTotal[i] - instUp[i] - instDown[i] })),
    byProgramme: prog.map((g, i) => ({ group: g, up: progUp[i], down: progDown[i], unchanged: progTotal[i] - progUp[i] - progDown[i] })),
    notified: Math.round(down * 0.82 + up),
  }
}

export interface TierImpact {
  aToB: number
  bToA: number
  rolesGained: number
  rolesLost: number
}

/** Impact of tier-rule changes on the 18,420 visible students (deterministic per setting). */
export function tierImpact(current: ProgrammeSettings, next: ProgrammeSettings): TierImpact {
  let aToB = 0
  let bToA = 0
  let rolesGained = 0
  let rolesLost = 0
  if (current.tier.graceCountsAsTierA !== next.tier.graceCountsAsTierA) {
    if (next.tier.graceCountsAsTierA) bToA += 9120
    else aToB += 9120
  }
  const missedDelta = next.tier.missedPaymentsForTierB - current.tier.missedPaymentsForTierB
  if (missedDelta > 0) bToA += 1340 * missedDelta
  if (missedDelta < 0) aToB += 1340 * -missedDelta
  if (current.tier.restructuredCountsAsTierA !== next.tier.restructuredCountsAsTierA) {
    if (next.tier.restructuredCountsAsTierA) bToA += 610
    else aToB += 610
  }
  if (current.tierB.partnerRoles !== next.tierB.partnerRoles) {
    if (next.tierB.partnerRoles === 'hidden') rolesLost += 7
    else rolesGained += 7
  }
  const windowDelta = next.tierB.earlyAccessDays - current.tierB.earlyAccessDays
  if (next.tierB.partnerRoles === 'earlyAccessWindow' && windowDelta !== 0) {
    if (windowDelta > 0) rolesLost += Math.min(6, Math.ceil(windowDelta / 3))
    else rolesGained += Math.min(6, Math.ceil(-windowDelta / 3))
  }
  return { aToB, bToA, rolesGained, rolesLost }
}

export function listChanges() {
  return delay(readDb().changeRequests, 100)
}

export async function proposeChange(officer: Officer, req: Omit<ChangeRequest, 'id' | 'drafter' | 'status' | 'createdAt'>) {
  const id = `CR-${{ rubric: 'RB', tierRules: 'TR', plan: 'FP' }[req.kind]}-${readDb().changeRequests.length + 101}`
  writeDb((d) => d.changeRequests.unshift({ ...req, id, drafter: officer.id, status: 'pendingApproval', createdAt: '2026-10-07' }))
  logAudit(officer, { rubric: 'Drafted rubric change', tierRules: 'Drafted tier rule change', plan: 'Drafted follow-up plan change' }[req.kind], req.kind, id, req.title)
  return delay(id, 250)
}

/** The second approver must be a different officer. Returns the change so the caller can apply a settings patch. */
export async function approveChange(officer: Officer, id: string) {
  const cr = readDb().changeRequests.find((c) => c.id === id)!
  if (cr.drafter === officer.id) throw new Error('second-approver')
  writeDb((d) => {
    const c = d.changeRequests.find((x) => x.id === id)!
    c.status = 'published'
    c.approver = officer.id
    c.effectiveAt = c.kind === 'tierRules' ? '2026-10-14' : '2026-10-07'
  })
  logAudit(officer, { rubric: 'Approved and published rubric change', tierRules: 'Approved tier rule change (two-person rule)', plan: 'Approved follow-up plan change (two-person rule)' }[cr.kind], cr.kind, id, cr.title)
  return delay(readDb().changeRequests.find((c) => c.id === id)!, 300)
}

export async function rejectChange(officer: Officer, id: string, reason: string) {
  writeDb((d) => {
    const c = d.changeRequests.find((x) => x.id === id)!
    c.status = 'rejected'
    c.approver = officer.id
  })
  logAudit(officer, 'Rejected change request', 'change', id, reason)
  return delay(true, 200)
}
