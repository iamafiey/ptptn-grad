import type { AuditEntry, Officer } from '@/types/domain'
import { readDb, writeDb } from './db'
import { delay } from './delay'

// Every agency action is logged: who, what, which record, when, where, why (docs §Audit, safety and PDPA).
// Actions taken this session can register an undo.

const undoers = new Map<string, () => void>()
let seq = 0

export function logAudit(officer: Officer, action: string, recordType: string, recordId: string, reason?: string, undo?: () => void): AuditEntry {
  const entry: AuditEntry = {
    id: `AU-${91000 + ++seq}`,
    at: new Date(`2026-10-07T${String(10 + Math.floor(seq / 6)).padStart(2, '0')}:${String((seq * 7) % 60).padStart(2, '0')}:00+08:00`).toISOString(),
    officerId: officer.id,
    action,
    recordType,
    recordId,
    reason,
    where: 'Agency workspace · 10.12.4.21',
  }
  writeDb((d) => d.audit.unshift(entry))
  if (undo) undoers.set(entry.id, undo)
  return entry
}

export function canUndo(id: string) {
  return undoers.has(id)
}

export async function undoAction(officer: Officer, id: string) {
  const fn = undoers.get(id)
  if (!fn) return false
  fn()
  undoers.delete(id)
  const original = readDb().audit.find((a) => a.id === id)
  logAudit(officer, `Undid: ${original?.action ?? id}`, original?.recordType ?? 'action', original?.recordId ?? id, 'Undo within session')
  return delay(true, 150)
}

export function recentActivity(officerId: string, n = 10) {
  return readDb().audit.filter((a) => a.officerId === officerId).slice(0, n)
}

export function listAudit() {
  return delay(readDb().audit, 120)
}

export function resetAuditSession() {
  undoers.clear()
}
