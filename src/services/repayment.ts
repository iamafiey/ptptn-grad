import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { RepaymentAccount } from '@/types/domain'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { buildSummary } from './jobLog'
import { buildTierView } from './tiers'

// Student-only repayment screen. This is the one student surface allowed to show amounts.

export type WayBack = 'payMissed' | 'salaryDeduction' | 'restructure'

export interface RepaymentView {
  account: RepaymentAccount
  tier: ReturnType<typeof buildTierView>
  missedAmountRM: number
  pendingWayBack: WayBack | null
  justRestored: boolean
  jobSearch: ReturnType<typeof buildSummary>
}

// Demo-only state: which way back is waiting on the sync, and whether to celebrate.
const pending: Record<string, WayBack | null> = {}
const restored: Record<string, boolean> = {}

export function buildRepayment(studentId: string, s: ProgrammeSettings): RepaymentView {
  const account = readDb().repayment[studentId]
  const missedAmountRM = account.payments.filter((p) => p.status === 'missed').reduce((sum, p) => sum + p.amountRM, 0)
  return { account, tier: buildTierView(studentId, s), missedAmountRM, pendingWayBack: pending[studentId] ?? null, justRestored: !!restored[studentId], jobSearch: buildSummary(studentId, s) }
}

export function getRepayment(studentId: string, s: ProgrammeSettings) {
  return delay(structuredClone(buildRepayment(studentId, s)), 160)
}

/** Submit a way back. Benefits restore only when the PTPTN sync confirms it (spec: restore on sync). */
export async function requestWayBack(studentId: string, kind: WayBack) {
  pending[studentId] = kind
  // Always write (even a no-op) so screens refetch.
  writeDb((d) => {
    if (kind === 'restructure') d.repayment[studentId].restructureRequest = { status: 'submitted', at: '2026-10-07' }
  })
  return delay(true, 600)
}

/** Demo control: simulate the repayment sync confirming the payment or plan. */
export async function simulateSyncConfirmed(studentId: string) {
  const kind = pending[studentId] ?? 'payMissed'
  // Flags first, then the write that notifies screens.
  pending[studentId] = null
  restored[studentId] = true
  writeDb((d) => {
    const a = d.repayment[studentId]
    if (kind === 'payMissed') {
      a.payments = a.payments.map((p) => (p.status === 'missed' ? { ...p, status: 'paid' as const } : p))
    }
    if (kind === 'salaryDeduction') a.method = 'salaryDeduction'
    if (kind === 'restructure') {
      a.method = 'restructured'
      a.restructureRequest = { status: 'approved', at: '2026-10-08' }
    }
    a.status = 'goodStanding'
    a.missedCount = 0
    d.notifications.unshift({ id: `n-restore-${studentId}`, studentId, type: 'benefits', channel: ['push'], body: { en: 'Your benefits are back. Premium roles are unlocked.', ms: 'Manfaat anda telah kembali. Peranan premium kini dibuka.' }, at: '2026-10-08T09:00:00+08:00', read: false, link: '/s/repayment' })
  })
  return delay(true, 900)
}

export function resetRepaymentDemo() {
  for (const k of Object.keys(pending)) delete pending[k]
  for (const k of Object.keys(restored)) delete restored[k]
}
