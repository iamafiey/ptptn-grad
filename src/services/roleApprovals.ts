import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { Check, Officer, PartnerRole, TalentPartner } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { slaStatus, workingDaysSince, type Sla } from './agencyQueues'

// Partner posts a role → check criteria (salary floor, permanent or graduate programme, partner in good standing)
// → officer approves or returns with reason → tier access rule applies (docs §Partner role approvals).

export interface PendingRole {
  role: PartnerRole
  partner: TalentPartner
  criteria: { salaryFloor: Check; contractType: Check; partnerStanding: Check }
  failing: string[]
  age: number
  sla: Sla
}

export function criteriaFor(role: PartnerRole, partner: TalentPartner, s: ProgrammeSettings) {
  const salaryFloor: Check = role.salaryRM.min >= s.partners.salaryFloorRM ? 'pass' : 'fail'
  const contractType: Check = s.partners.allowedContractTypes.includes(role.contractType) ? 'pass' : 'fail'
  const partnerStanding: Check = partner.status === 'paused' || partner.status === 'ended' ? 'fail' : partner.onboardingStage === 'probation' ? 'warn' : 'pass'
  return { salaryFloor, contractType, partnerStanding }
}

const LABEL = { salaryFloor: 'salary floor', contractType: 'contract type', partnerStanding: 'partner standing' }

export function listPendingRoles(s: ProgrammeSettings): PendingRole[] {
  return readDb()
    .partnerRoles.filter((r) => r.status === 'pendingApproval')
    .map((role) => {
      const partner = readDb().partners.find((p) => p.id === role.partnerId)!
      const criteria = criteriaFor(role, partner, s)
      const age = workingDaysSince(role.postedAt)
      return { role, partner, criteria, failing: (Object.keys(criteria) as (keyof typeof criteria)[]).filter((k) => criteria[k] === 'fail').map((k) => LABEL[k]), age, sla: slaStatus(age, s.sla.partnerRoleApprovals) }
    })
}

export function getPendingRoles(s: ProgrammeSettings) {
  return delay(listPendingRoles(s), 150)
}

/** Approve: the role goes live for students (subject to tier access). Return: back to the partner with a reason. */
export async function decideRole(officer: Officer, roleId: string, decision: 'approve' | 'return', reason?: string) {
  const postedBefore = readDb().partnerRoles.find((x) => x.id === roleId)!.postedAt
  writeDb((d) => {
    const r = d.partnerRoles.find((x) => x.id === roleId)!
    r.status = decision === 'approve' ? 'live' : 'returned'
    r.postedAt = decision === 'approve' ? '2026-10-07' : r.postedAt
    r.approval = { ...(r.approval ?? { criteria: { salaryFloor: 'pass', contractType: 'pass', partnerStanding: 'pass' } }), decidedBy: officer.id, reason }
  })
  logAudit(officer, decision === 'approve' ? 'Approved partner role' : 'Returned partner role', 'partnerRole', roleId, reason, () =>
    writeDb((d) => {
      const r = d.partnerRoles.find((x) => x.id === roleId)!
      r.status = 'pendingApproval'
      r.postedAt = postedBefore
    }),
  )
  return delay(true, 350)
}
