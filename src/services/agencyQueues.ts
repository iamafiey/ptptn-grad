import type { ProgrammeSettings } from '@/config/programmeSettings'
import { QUEUE_DEFS, TODAY, workingDaysAgo, type GenericCase } from '@/data/agency'
import type { LocalizedText, Officer, OfficerRole, QueueId } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { listOpenEvidence } from './evidenceReview'
import { listPendingRoles } from './roleApprovals'
import { skillById } from './taxonomy'

// Agency queues: counts, oldest age and SLA in working days (docs §Admin home).

export type Sla = 'onTime' | 'dueToday' | 'overdue'

export function workingDaysSince(iso: string) {
  // UTC date-only maths (timezone-independent).
  const end = new Date(`${TODAY}T00:00:00Z`)
  let n = 0
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) n++
  }
  return n
}

export function slaStatus(ageDays: number, slaDays: number): Sla {
  if (ageDays > slaDays) return 'overdue'
  if (ageDays === slaDays) return 'dueToday'
  return 'onTime'
}

export interface QueueRow {
  id: string
  queueId: QueueId
  subject: string
  reason: LocalizedText
  ai?: { action: 'approve' | 'reject' | 'escalate'; confidence: number; rationale: string }
  createdAt: string
  age: number
  sla: Sla
  detail: { label: string; value: string }[]
  /** Dedicated screen for this queue, if any. */
  href?: string
}

/** Who can work a queue: its owner role and super admin (leadership can view). */
export function canWorkQueue(role: OfficerRole, queueId: QueueId) {
  const def = QUEUE_DEFS.find((q) => q.id === queueId)!
  return role === 'superAdmin' || role === def.ownerRole
}

export function queuesForRole(role: OfficerRole) {
  if (role === 'superAdmin' || role === 'leadershipViewer') return QUEUE_DEFS
  return QUEUE_DEFS.filter((q) => q.ownerRole === role)
}

const STUDENT_CODES: Record<string, string> = { hafiz: 'S-26013', kavitha: 'S-24087', nurul: 'S-26150' }
export const studentCode = (id: string) => STUDENT_CODES[id] ?? id

function disputeRows(s: ProgrammeSettings): QueueRow[] {
  const d = readDb()
  const real: QueueRow[] = Object.values(d.students).flatMap((st) =>
    (st.skills ?? [])
      .filter((sk) => sk.status === 'disputed')
      .map((sk) => {
        const created = st.student.id === 'hafiz' ? workingDaysAgo(2) : TODAY
        const age = workingDaysSince(created)
        return {
          id: `SD-${st.student.id}-${sk.skillId}`,
          queueId: 'skillDisputes' as const,
          subject: `Student ${studentCode(st.student.id)}`,
          reason: { en: `Disputes ${skillById(sk.skillId)?.name.en ?? sk.skillId} (${sk.level})`, ms: `Mempertikaikan ${skillById(sk.skillId)?.name.ms ?? sk.skillId}` },
          ai: { action: 'escalate' as const, confidence: sk.confidence, rationale: sk.rationale.en },
          createdAt: created,
          age,
          sla: slaStatus(age, s.sla.skillDisputes),
          detail: [{ label: 'Rubric hits', value: sk.rubricHits.join(', ') || '—' }],
        }
      }),
  )
  return real
}

function genericRows(queueId: QueueId, s: ProgrammeSettings): QueueRow[] {
  return readDb()
    .genericCases.filter((c: GenericCase) => c.queueId === queueId && c.status === 'open')
    .map((c) => {
      const age = workingDaysSince(c.createdAt)
      return { id: c.id, queueId, subject: c.subject, reason: c.reason, ai: c.ai, createdAt: c.createdAt, age, sla: slaStatus(age, s.sla[queueId]), detail: c.detail }
    })
}

export function buildQueueRows(queueId: QueueId, s: ProgrammeSettings): QueueRow[] {
  let rows: QueueRow[]
  if (queueId === 'evidence') rows = listOpenEvidence(s).map((e) => ({ id: e.id, queueId, subject: `Student ${e.studentCode}`, reason: e.reason, ai: { action: 'escalate' as const, confidence: e.entry.check?.confidence ?? 0, rationale: e.reason.en }, createdAt: e.createdAt, age: e.age, sla: e.sla, detail: [], href: `/a/job-search/evidence?case=${e.id}` }))
  else if (queueId === 'partnerRoleApprovals') rows = listPendingRoles(s).map((p) => ({ id: p.role.id, queueId, subject: `${p.partner.name} · ${p.role.title}`, reason: { en: p.failing.length ? `Fails: ${p.failing.join(', ')}` : 'All criteria met', ms: p.failing.length ? `Gagal: ${p.failing.join(', ')}` : 'Semua kriteria dipenuhi' }, ai: { action: p.failing.length ? ('reject' as const) : ('approve' as const), confidence: 0.9, rationale: 'Criteria check' }, createdAt: p.role.postedAt, age: p.age, sla: p.sla, detail: [], href: `/a/partners/approvals?role=${p.role.id}` }))
  else if (queueId === 'skillDisputes') rows = [...disputeRows(s), ...genericRows(queueId, s)]
  else rows = genericRows(queueId, s)
  return rows.sort((a, b) => b.age - a.age)
}

export function buildQueueSummaries(role: OfficerRole, s: ProgrammeSettings) {
  return queuesForRole(role).map((def) => {
    const rows = buildQueueRows(def.id, s)
    const oldest = rows.reduce((m, r) => Math.max(m, r.age), 0)
    return {
      def: { ...def, slaWorkingDays: s.sla[def.id] },
      count: rows.length,
      oldest,
      overdue: rows.filter((r) => r.sla === 'overdue').length,
      dueToday: rows.filter((r) => r.sla === 'dueToday').length,
      sla: rows.some((r) => r.sla === 'overdue') ? ('overdue' as Sla) : rows.some((r) => r.sla === 'dueToday') ? ('dueToday' as Sla) : ('onTime' as Sla),
    }
  })
}

export function getQueue(queueId: QueueId, s: ProgrammeSettings) {
  return delay({ def: QUEUE_DEFS.find((q) => q.id === queueId)!, rows: buildQueueRows(queueId, s) }, 150)
}

/** Decide a generic queue item. Real disputes are resolved on the student's skill. */
export async function decideGeneric(officer: Officer, row: QueueRow, action: 'approved' | 'rejected' | 'escalated', reason?: string) {
  if (row.id.startsWith('SD-') && row.queueId === 'skillDisputes' && row.id.split('-').length > 2) {
    const [, studentId, ...rest] = row.id.split('-')
    const skillId = rest.join('-')
    const prev = readDb().students[studentId].skills!.find((x) => x.skillId === skillId)!.status
    writeDb((d) => {
      const sk = d.students[studentId].skills!.find((x) => x.skillId === skillId)!
      sk.status = 'kept'
      d.notifications.unshift({ id: `n-dispute-${skillId}-${action}`, studentId, type: 'rescored', channel: ['inApp'], body: action === 'approved' ? { en: 'Your skill dispute was reviewed. The skill is visible again.', ms: 'Pertikaian kemahiran anda telah disemak. Kemahiran kelihatan semula.' } : { en: 'Your skill dispute was reviewed and the level was kept.', ms: 'Pertikaian anda disemak dan tahap dikekalkan.' }, at: '2026-10-07T12:00:00+08:00', read: false, link: '/s/profile' })
    })
    logAudit(officer, action === 'approved' ? 'Corrected skill (dispute)' : 'Upheld skill dispute', 'dispute', row.id, reason, () =>
      writeDb((d) => {
        d.students[studentId].skills!.find((x) => x.skillId === skillId)!.status = prev
      }),
    )
    return delay(true, 300)
  }
  writeDb((d) => {
    const c = d.genericCases.find((x) => x.id === row.id)
    if (c) c.status = action
  })
  const verb = { approved: 'Approved', rejected: 'Rejected', escalated: 'Escalated' }[action]
  logAudit(officer, `${verb} ${QUEUE_DEFS.find((q) => q.id === row.queueId)!.title.en.toLowerCase()} item`, row.queueId, row.id, reason, () =>
    writeDb((d) => {
      const c = d.genericCases.find((x) => x.id === row.id)
      if (c) c.status = 'open'
    }),
  )
  return delay(true, 300)
}
