import { CONSENT_VERSIONS, INTEGRATIONS, SCAM_NOTICE } from '@/data/settingsAdmin'
import type { Officer } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'

// Settings: PDPA (consents, data requests, deletion flow), safety controls, integrations.

export function getPdpa() {
  return delay({ requests: readDb().dataRequests, consents: CONSENT_VERSIONS }, 120)
}

/** Deletion: remove from search immediately, then delete/anonymise per retention, then log completion. */
export async function advanceRequest(officer: Officer, id: string) {
  const r = readDb().dataRequests.find((x) => x.id === id)!
  const next = r.kind === 'deletion' && r.status === 'open' ? 'removedFromSearch' : 'completed'
  writeDb((d) => (d.dataRequests.find((x) => x.id === id)!.status = next))
  const action = next === 'removedFromSearch' ? 'Removed student from partner search (deletion request)' : r.kind === 'deletion' ? 'Deleted and anonymised student data' : `Completed ${r.kind} request`
  logAudit(officer, action, 'dataRequest', id, r.studentCode)
  return delay(next, 250)
}

export function getSafety() {
  return delay({ outreachPaused: readDb().outreachPaused, chatFlags: readDb().chatFlags }, 100)
}

export async function setOutreachPaused(officer: Officer, paused: boolean, reason: string) {
  writeDb((d) => (d.outreachPaused = paused))
  logAudit(officer, paused ? 'Paused all partner outreach (kill switch)' : 'Resumed partner outreach', 'safety', 'outreach', reason, () => writeDb((d) => (d.outreachPaused = !paused)))
  return delay(true, 200)
}

/** Bulk notice to every student about a scam pattern. */
export async function sendScamNotice(officer: Officer, custom?: string) {
  const body = custom ? { en: custom, ms: custom } : SCAM_NOTICE
  writeDb((d) => {
    for (const id of Object.keys(d.students))
      d.notifications.unshift({ id: `n-scam-${id}-${d.notifications.length}`, studentId: id, type: 'newMatches', channel: ['push', 'sms'], body, at: '2026-10-07T15:00:00+08:00', read: false })
  })
  logAudit(officer, 'Sent scam warning to all students', 'safety', 'notice', body.en)
  return delay(true, 300)
}

export async function resolveChatFlag(officer: Officer, id: string, action: 'dismissed' | 'escalated') {
  const f = readDb().chatFlags.find((x) => x.id === id)!
  writeDb((d) => (d.chatFlags = d.chatFlags.filter((x) => x.id !== id)))
  logAudit(officer, action === 'escalated' ? 'Escalated partner chat to partnership manager' : 'Dismissed keyword flag', 'chatFlag', id, `${f.partner}: “${f.keyword}”`)
  return delay(true, 150)
}

export function listIntegrations() {
  return INTEGRATIONS
}
