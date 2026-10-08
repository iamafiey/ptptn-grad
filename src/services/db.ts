import { useSyncExternalStore } from 'react'
import { STUDENT_SEEDS, type StudentSeed } from '@/data/students'
import { INVITATIONS, PARTNER_ROLES } from '@/data/partners'
import { JOB_LOG_SEED, LOG_EVIDENCE_PREVIEW, NOTIFICATIONS_SEED, REPAYMENT_SEED } from '@/data/jobLog'
import { ENROLMENTS_SEED } from '@/data/courses'
import type { AppNotification, Enrolment, Invitation, JobLogEntry, PartnerRole, RepaymentAccount } from '@/types/domain'

// In-memory mock backend. Services read and write here; Reset demo reseeds it.
// Swapping to a real API means replacing the service functions, not the UI.

export interface LogEvidence {
  fileName: string
  previewUrl: string
}

interface Db {
  students: Record<string, StudentSeed>
  partnerRoles: PartnerRole[]
  invitations: Invitation[]
  jobLog: Record<string, JobLogEntry[]>
  logEvidence: Record<string, LogEvidence>
  repayment: Record<string, RepaymentAccount>
  notifications: AppNotification[]
  enrolments: Record<string, Enrolment[]>
}

const clone = <T,>(v: T): T => structuredClone(v)

function seed(): Db {
  return {
    students: clone(STUDENT_SEEDS),
    partnerRoles: clone(PARTNER_ROLES),
    invitations: clone(INVITATIONS),
    jobLog: clone(JOB_LOG_SEED),
    logEvidence: Object.fromEntries(Object.entries(LOG_EVIDENCE_PREVIEW).map(([id, url]) => [id, { fileName: url.split('/').pop()!, previewUrl: url }])),
    repayment: clone(REPAYMENT_SEED),
    notifications: clone(NOTIFICATIONS_SEED),
    enrolments: clone(ENROLMENTS_SEED),
  }
}

let db: Db = seed()
let version = 0
const listeners = new Set<() => void>()

function emit() {
  version++
  listeners.forEach((l) => l())
}

export function readDb(): Db {
  return db
}

/** Apply a write and notify subscribers (hooks refetch). */
export function writeDb(fn: (d: Db) => void) {
  fn(db)
  emit()
}

export function resetDb() {
  db = seed()
  emit()
}

/** Increments on every write; hooks use it to know when to refetch. */
export function useDbVersion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
}
