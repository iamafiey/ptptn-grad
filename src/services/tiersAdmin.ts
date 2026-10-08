import type { ProgrammeSettings } from '@/config/programmeSettings'
import { RECOVERIES_MONTHLY, SYNC_HISTORY, TIER_BY_COHORT } from '@/data/agency6'
import type { Officer } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'

// Repayment tiers module. Repayment data never leaves it (collection liaison + super admin only).

let syncHistory = structuredClone(SYNC_HISTORY)

export function getSync() {
  return delay({ history: syncHistory, last: syncHistory[0] }, 120)
}

export async function retrySync(officer: Officer) {
  await delay(null, 1200)
  syncHistory = [{ at: '2026-10-07T11:05:00+08:00', records: 18251, errors: 0, state: 'ok', note: 'Manual retry succeeded' }, ...syncHistory]
  logAudit(officer, 'Retried repayment sync', 'sync', 'SYNC-20261007', 'Manual retry after 02:00 failure')
  writeDb(() => {})
  return true
}

export function resetTiersAdmin() {
  syncHistory = structuredClone(SYNC_HISTORY)
}

export function listOverrides() {
  return delay(readDb().overrides, 120)
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Restore Tier A for a fixed period with a reason; auto-expires. Demo students get their benefits back now. */
export async function grantOverride(officer: Officer, id: string, s: ProgrammeSettings, reason: string) {
  const o = readDb().overrides.find((x) => x.id === id)!
  writeDb((d) => {
    const x = d.overrides.find((y) => y.id === id)!
    x.status = 'active'
    x.expiresAt = addDays('2026-10-07', s.tier.overrideDays)
    if (x.studentId)
      d.notifications.unshift({ id: `n-ov-${id}`, studentId: x.studentId, type: 'benefits', channel: ['push'], body: { en: 'Your benefits are back while your payment is confirmed.', ms: 'Manfaat anda kembali sementara bayaran anda disahkan.' }, at: '2026-10-07T14:00:00+08:00', read: false, link: '/s/repayment' })
  })
  logAudit(officer, `Granted tier override (${s.tier.overrideDays} days)`, 'tierOverride', o.studentCode, reason, () =>
    writeDb((d) => {
      const x = d.overrides.find((y) => y.id === id)!
      x.status = 'pending'
      x.expiresAt = undefined
    }),
  )
  return delay(true, 300)
}

export async function rejectOverride(officer: Officer, id: string, reason: string) {
  const o = readDb().overrides.find((x) => x.id === id)!
  writeDb((d) => (d.overrides.find((y) => y.id === id)!.status = 'rejected'))
  logAudit(officer, 'Rejected tier override', 'tierOverride', o.studentCode, reason)
  return delay(true, 200)
}

/** Demo: jump to expiry. Without a confirmed sync, the student returns to their synced tier. */
export async function expireOverride(officer: Officer, id: string) {
  const o = readDb().overrides.find((x) => x.id === id)!
  writeDb((d) => (d.overrides.find((y) => y.id === id)!.status = 'expired'))
  logAudit(officer, 'Override expired', 'tierOverride', o.studentCode, 'Auto-expiry (demo fast-forward)')
  return delay(true, 200)
}

export function distribution() {
  return { byCohort: TIER_BY_COHORT, recoveries: RECOVERIES_MONTHLY }
}
