import type { ProgrammeSettings } from '@/config/programmeSettings'
import { PARTNER_INTEREST } from '@/data/partners'
import type { DeclineReason, Invitation, PartnerRole, RoleAccess, TalentPartner } from '@/types/domain'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { matchRole, type SkillMatch } from './matching'
import { roleAccess } from './tiers'

// Student-facing partner roles and invitations.

export interface PartnerRoleView {
  role: PartnerRole
  partner: Pick<TalentPartner, 'id' | 'name' | 'monogram' | 'sector'>
  /** The only tier-derived field. */
  access: RoleAccess
  matchPct: number
  detail: SkillMatch[]
  invitation?: Invitation
}

const partnerOf = (id: string) => {
  const p = readDb().partners.find((x) => x.id === id)!
  return { id: p.id, name: p.name, monogram: p.monogram, sector: p.sector }
}

export function buildRoleViews(studentId: string, s: ProgrammeSettings): PartnerRoleView[] {
  const d = readDb()
  const skills = d.students[studentId]?.skills ?? []
  return d.partnerRoles
    // Roles from paused or ended partners are hidden from students.
    .filter((r) => r.status === 'live' && ['active', 'onboarding'].includes(d.partners.find((p) => p.id === r.partnerId)?.status ?? 'active'))
    .map((role) => {
      const m = matchRole(role, skills)
      const invitation = d.invitations.find((i) => i.roleId === role.id && i.studentId === studentId)
      return { role, partner: partnerOf(role.partnerId), access: roleAccess(studentId, role, s), matchPct: m.pct, detail: m.detail, invitation }
    })
    .filter((v) => v.access !== 'hidden')
    .sort((a, b) => Number(!!b.invitation) - Number(!!a.invitation) || b.matchPct - a.matchPct)
}

export function listPartnerRoles(studentId: string, s: ProgrammeSettings) {
  return delay(buildRoleViews(studentId, s), 180)
}

/** Count of live roles hidden from this student by the tier setting (for a gentle note). */
export function hiddenRoleCount(studentId: string, s: ProgrammeSettings) {
  return readDb().partnerRoles.filter((r) => r.status === 'live' && roleAccess(studentId, r, s) === 'hidden').length
}

export function partnerInterest(studentId: string) {
  return PARTNER_INTEREST[studentId] ?? { viewsThisWeek: 0, viewsLastWeek: 0 }
}

function editInvitation(id: string, fn: (i: Invitation) => void) {
  writeDb((d) => {
    const inv = d.invitations.find((x) => x.id === id)
    if (inv) fn(inv)
  })
}

/** Accept and share profile: the partner now sees name and contact details. */
export async function acceptInvitation(id: string) {
  editInvitation(id, (i) => {
    i.stage = 'talking'
    i.profileShared = true
    i.messages.push({ from: 'student', body: 'Accepted and shared my profile.', at: '2026-10-07T10:30:00+08:00', identityHidden: false })
  })
  return delay(true, 400)
}

/** Ask a question with identity hidden; the partner replies (simulated). */
export async function askQuestion(id: string, body: string) {
  editInvitation(id, (i) => i.messages.push({ from: 'student', body, at: '2026-10-07T10:31:00+08:00', identityHidden: !i.profileShared }))
  await delay(true, 1200)
  editInvitation(id, (i) =>
    i.messages.push({ from: 'partner', body: 'Good question. Starting salary is fixed for the programme, with a review after 6 months. Happy to share more once you accept.', at: '2026-10-07T10:33:00+08:00', identityHidden: false }),
  )
  return true
}

export async function declineInvitation(id: string, reasons: DeclineReason[]) {
  editInvitation(id, (i) => {
    i.stage = 'declined'
    i.declineReasons = reasons
  })
  return delay(true, 300)
}

/** Express interest in a role without an invitation: shares the profile with that partner only. */
export async function expressInterest(studentId: string, roleId: string) {
  writeDb((d) => {
    if (d.invitations.some((i) => i.roleId === roleId && i.studentId === studentId)) return
    d.invitations.push({
      id: `inv-${roleId}-${studentId}`,
      roleId,
      studentId,
      stage: 'talking',
      origin: 'student',
      sentAt: '2026-10-07',
      replyBy: '2026-10-10',
      matchPct: 0,
      whyYouMatch: [],
      profileShared: true,
      messages: [{ from: 'student', body: 'Expressed interest and shared my profile.', at: '2026-10-07T10:30:00+08:00', identityHidden: false }],
    })
  })
  return delay(true, 400)
}
