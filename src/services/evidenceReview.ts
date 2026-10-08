import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { JobLogEntry, LocalizedText, Officer } from '@/types/domain'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { slaStatus, studentCode, workingDaysSince, type Sla } from './agencyQueues'
import { asset } from '@/lib/asset'

// Evidence AI could not verify with confidence (docs §Evidence verification step 5):
// officer sees evidence beside AI-extracted fields → Verify, Reject with reason, or Flag account.

export interface EvidenceQueueItem {
  id: string
  studentCode: string
  /** Real demo student id, when the case belongs to Hafiz/Kavitha/Nurul. */
  studentId?: string
  institution: string
  entry: JobLogEntry
  preview: string
  reason: LocalizedText
  createdAt: string
  age: number
  sla: Sla
  flagged: boolean
}

export function listOpenEvidence(s: ProgrammeSettings): EvidenceQueueItem[] {
  const d = readDb()
  const real: EvidenceQueueItem[] = Object.entries(d.jobLog).flatMap(([sid, entries]) =>
    entries
      .filter((e) => e.status === 'underReview')
      .map((e) => {
        // Escalated when the AI check ran.
        const createdAt = (e.check?.checkedAt ?? e.appliedAt).slice(0, 10)
        const age = workingDaysSince(createdAt)
        return {
          id: `EV-${e.id}`,
          studentCode: studentCode(sid),
          studentId: sid,
          institution: d.students[sid]?.student.institution.match(/\(([^)]+)\)/)?.[1] ?? d.students[sid]?.student.institution ?? '',
          entry: e,
          preview: e.evidenceId ? d.logEvidence[e.evidenceId]?.previewUrl ?? asset('evidence/photo.svg') : asset('evidence/photo.svg'),
          reason: e.check?.reasons[0] ?? { en: 'Needs officer review', ms: 'Perlu semakan pegawai' },
          createdAt,
          age,
          sla: slaStatus(age, s.sla.evidence),
          flagged: d.flags.some((f) => f.studentId === sid && f.kind === 'reusedEvidence'),
        }
      }),
  )
  const synthetic: EvidenceQueueItem[] = d.evidenceCases
    .filter((c) => c.decision === undefined)
    .map((c) => {
      const age = workingDaysSince(c.entry.appliedAt)
      return { id: c.id, studentCode: c.studentCode, institution: c.institution, entry: c.entry, preview: c.preview, reason: c.entry.check!.reasons[0], createdAt: c.entry.appliedAt, age, sla: slaStatus(age, s.sla.evidence), flagged: false }
    })
  return [...real, ...synthetic].sort((a, b) => b.age - a.age || a.id.localeCompare(b.id))
}

export function getEvidenceQueue(s: ProgrammeSettings) {
  return delay(listOpenEvidence(s), 150)
}

export type EvidenceDecision = 'verify' | 'reject' | 'flag'

export async function decideEvidence(officer: Officer, item: EvidenceQueueItem, decision: EvidenceDecision, reason?: string) {
  const label = { verify: 'Verified evidence', reject: 'Rejected evidence', flag: 'Flagged account' }[decision]
  if (item.studentId) {
    // Real student: the decision flows back to their job search log and notifications.
    const sid = item.studentId
    const entryId = item.entry.id
    const before = structuredClone(item.entry)
    writeDb((d) => {
      const e = d.jobLog[sid].find((x) => x.id === entryId)!
      if (decision === 'verify') {
        e.status = 'verified'
        e.rejectionReason = undefined
      } else if (decision === 'reject') {
        e.status = 'rejected'
        e.rejectionReason = { en: reason || 'An officer couldn’t verify this evidence. Please re-upload.', ms: reason || 'Pegawai tidak dapat mengesahkan bukti ini. Sila muat naik semula.' }
      } else {
        e.status = 'rejected'
        e.rejectionReason = { en: 'An officer has asked for the original document. Please re-upload.', ms: 'Pegawai meminta dokumen asal. Sila muat naik semula.' }
        d.flags.push({ id: `FL-${entryId}`, studentId: sid, kind: 'reusedEvidence', detail: reason || 'Flagged from evidence review', raisedAt: '2026-10-07' })
      }
      d.notifications.unshift({
        id: `n-officer-${entryId}-${decision}`,
        studentId: sid,
        type: 'evidence',
        channel: decision === 'verify' ? ['inApp'] : ['inApp', 'push'],
        body: decision === 'verify' ? { en: `An officer verified your application to ${e.company}.`, ms: `Pegawai mengesahkan permohonan anda ke ${e.company}.` } : { en: `Your evidence for ${e.company} needs a re-upload.`, ms: `Bukti anda untuk ${e.company} perlu dimuat naik semula.` },
        at: '2026-10-07T12:30:00+08:00',
        read: false,
        link: `/s/opportunities?tab=log&entry=${entryId}`,
      })
    })
    logAudit(officer, label, 'evidence', item.id, reason, () =>
      writeDb((d) => {
        const list = d.jobLog[sid]
        const i = list.findIndex((x) => x.id === entryId)
        list[i] = before
        d.flags = d.flags.filter((f) => f.id !== `FL-${entryId}`)
      }),
    )
  } else {
    writeDb((d) => {
      const c = d.evidenceCases.find((x) => x.id === item.id)!
      c.decision = decision === 'verify' ? 'verified' : decision === 'reject' ? 'rejected' : 'flagged'
      if (decision === 'flag') d.flags.push({ id: `FL-${item.id}`, studentId: item.studentCode, kind: 'reusedEvidence', detail: reason || 'Flagged from evidence review', raisedAt: '2026-10-07' })
    })
    logAudit(officer, label, 'evidence', item.id, reason, () =>
      writeDb((d) => {
        const c = d.evidenceCases.find((x) => x.id === item.id)!
        c.decision = undefined
        d.flags = d.flags.filter((f) => f.id !== `FL-${item.id}`)
      }),
    )
  }
  return delay(true, 350)
}
