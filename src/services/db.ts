import { useSyncExternalStore } from 'react'
import { STUDENT_SEEDS, type StudentSeed } from '@/data/students'
import { INVITATIONS, PARTNERS, PARTNER_ROLES } from '@/data/partners'
import { DISPUTES_SEED, FLAGS_SEED, OVERRIDES_SEED, type DisputeCase, type OverrideRequest } from '@/data/agency6'
import { JOB_LOG_SEED, LOG_EVIDENCE_PREVIEW, NOTIFICATIONS_SEED, REPAYMENT_SEED } from '@/data/jobLog'
import { COURSES, ENROLMENTS_SEED } from '@/data/courses'
import { CHAT_FLAGS_SEED, DATA_REQUESTS_SEED, type ChatFlag, type DataRequest } from '@/data/settingsAdmin'
import { AUDIT_SEED, GENERIC_CASES, PLACEMENTS, buildEvidenceCases, type EvidenceCase, type GenericCase } from '@/data/agency'
import type { AccountFlag, AppNotification, AuditEntry, Course, Enrolment, Invitation, JobLogEntry, PartnerRole, Placement, RepaymentAccount, TalentPartner } from '@/types/domain'

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
  evidenceCases: EvidenceCase[]
  genericCases: GenericCase[]
  placements: Placement[]
  audit: AuditEntry[]
  flags: AccountFlag[]
  partners: TalentPartner[]
  courses: Course[]
  disputes: DisputeCase[]
  overrides: OverrideRequest[]
  changeRequests: ChangeRequest[]
  /** Officer notes and actions on student records. */
  studentNotes: Record<string, { by: string; at: string; body: string }[]>
  pausedVisibility: string[]
  dataRequests: DataRequest[]
  chatFlags: ChatFlag[]
  /** Safety kill switch: all partner outreach paused. */
  outreachPaused: boolean
}

/** Two-person-rule change (rubric or tier rules): draft → pending approval → published. */
export interface ChangeRequest {
  id: string
  kind: 'rubric' | 'tierRules'
  title: string
  detail: string
  /** For tier rules: the settings patch to apply on publish. */
  patch?: Record<string, unknown>
  drafter: string
  approver?: string
  status: 'pendingApproval' | 'published' | 'rejected'
  createdAt: string
  effectiveAt?: string
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
    evidenceCases: buildEvidenceCases(),
    genericCases: clone(GENERIC_CASES),
    placements: clone(PLACEMENTS),
    audit: clone(AUDIT_SEED),
    flags: clone(FLAGS_SEED),
    partners: clone(PARTNERS),
    courses: clone(COURSES),
    disputes: clone(DISPUTES_SEED),
    overrides: clone(OVERRIDES_SEED),
    changeRequests: [],
    studentNotes: {},
    pausedVisibility: [],
    dataRequests: clone(DATA_REQUESTS_SEED),
    chatFlags: clone(CHAT_FLAGS_SEED),
    outreachPaused: false,
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
