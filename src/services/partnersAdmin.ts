import type { ProgrammeSettings } from '@/config/programmeSettings'
import { MATCHING_BY_PARTNER, UNSEEN_SUMMARY } from '@/data/agency6'
import { PORTALS } from '@/data/jobs'
import type { Officer, PartnerStatus, TalentPartner } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { portalMode } from './jobs'

// Talent Partner directory, commitment tracker, onboarding, portal feeds, matching monitor.

export interface PartnerRow {
  partner: TalentPartner
  rolesLive: number
  rolesPending: number
  /** Roles posted vs pro-rata commitment (months into the agreement year). */
  committedToDate: number
  behindOnRoles: boolean
  slowToRespond: boolean
}

const TODAY = new Date('2026-10-07T00:00:00Z')

export function buildPartnerRows(): PartnerRow[] {
  const d = readDb()
  return d.partners.map((p) => {
    const months = p.agreement.signedAt ? Math.max(1, Math.round((TODAY.getTime() - new Date(`${p.agreement.signedAt}T00:00:00Z`).getTime()) / (30.4 * 86_400_000))) : 0
    const committedToDate = Math.round((p.agreement.rolesPerYear * Math.min(12, months)) / 12)
    return {
      partner: p,
      rolesLive: d.partnerRoles.filter((r) => r.partnerId === p.id && r.status === 'live').length,
      rolesPending: d.partnerRoles.filter((r) => r.partnerId === p.id && r.status === 'pendingApproval').length,
      committedToDate,
      behindOnRoles: p.status === 'active' && p.metrics.rolesPosted < committedToDate * 0.7,
      slowToRespond: p.metrics.avgResponseHours > p.agreement.responseDays * 24,
    }
  })
}

export function listPartners() {
  return delay(buildPartnerRows(), 140)
}

export function getPartner(id: string) {
  const row = buildPartnerRows().find((r) => r.partner.id === id)
  const roles = readDb().partnerRoles.filter((r) => r.partnerId === id)
  return delay(row ? { ...row, roles } : null, 120)
}

/** Pause / End / Renew. Pausing hides the partner's roles from students immediately. */
export async function setPartnerStatus(officer: Officer, id: string, status: PartnerStatus | 'renew', reason?: string) {
  const before = structuredClone(readDb().partners.find((p) => p.id === id)!)
  writeDb((d) => {
    const p = d.partners.find((x) => x.id === id)!
    if (status === 'renew') p.agreement.renewsAt = '2027-10-07'
    else p.status = status
  })
  const label = status === 'renew' ? 'Renewed partner agreement' : status === 'paused' ? 'Paused partner' : status === 'ended' ? 'Ended partner' : 'Reactivated partner'
  logAudit(officer, label, 'partner', id, reason, () =>
    writeDb((d) => {
      const i = d.partners.findIndex((x) => x.id === id)
      d.partners[i] = before
    }),
  )
  return delay(true, 300)
}

export async function addPartnerNote(officer: Officer, id: string, body: string) {
  writeDb((d) => d.partners.find((p) => p.id === id)!.notes.unshift({ id: `note-${Date.now() % 100000}`, by: officer.name, at: '2026-10-07', body }))
  logAudit(officer, 'Added partner note', 'partner', id, body)
  return delay(true, 150)
}

export function listPortalRows(s: ProgrammeSettings) {
  return PORTALS.map((p) => ({ portal: p, mode: portalMode(p, s), reported: readDb().genericCases.filter((c) => c.queueId === 'portalFeedIssues' && c.subject.includes(p.name) && c.status === 'open').length }))
}

export function matchingStats() {
  const rows = readDb().partners.map((p) => ({ partner: p, ...MATCHING_BY_PARTNER[p.id] }))
  const totals = rows.reduce((t, r) => ({ views: t.views + r.views, invitations: t.invitations + r.invitations, acceptances: t.acceptances + r.acceptances, hires: t.hires + r.hires }), { views: 0, invitations: 0, acceptances: 0, hires: 0 })
  return { rows, totals, unseen: UNSEEN_SUMMARY }
}
