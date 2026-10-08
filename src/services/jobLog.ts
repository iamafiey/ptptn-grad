import type { ProgrammeSettings } from '@/config/programmeSettings'
import type { EvidenceCheckResult, JobLogEntry, LogOutcome, MonthlyJobSearchSummary as MonthlySummary } from '@/types/domain'
import { readDb, writeDb, type LogEvidence } from './db'
import { delay } from './delay'
import { checkEvidence, previewFor, type EvidenceInput } from './evidenceCheck'

export interface LogEntryView extends JobLogEntry {
  evidence?: LogEvidence
}

export const CURRENT_MONTH = '2026-10'

export function buildLog(studentId: string): LogEntryView[] {
  const d = readDb()
  return [...(d.jobLog[studentId] ?? [])]
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((e) => ({ ...e, evidence: e.evidenceId ? d.logEvidence[e.evidenceId] : undefined }))
}

export function listLog(studentId: string) {
  return delay(buildLog(studentId), 160)
}

/** Verified applications this month count toward the active job-seeking threshold. */
export function buildSummary(studentId: string, s: ProgrammeSettings, month = CURRENT_MONTH): MonthlySummary {
  const entries = (readDb().jobLog[studentId] ?? []).filter((e) => e.appliedAt.startsWith(month))
  const verified = entries.filter((e) => e.status === 'verified').length
  return {
    month,
    logged: entries.length,
    verified,
    underReview: entries.filter((e) => e.status === 'underReview').length,
    interviews: entries.filter((e) => e.outcome === 'interview' || e.outcome === 'offer' || e.outcome === 'hired').length,
    threshold: s.jobSeeking.monthlyThreshold,
    met: verified >= s.jobSeeking.monthlyThreshold,
  }
}

export interface LogInput {
  portalId?: string
  portalName: string
  role: string
  company: string
  appliedAt: string
}

export async function logApplication(studentId: string, input: LogInput) {
  const id = `log-${studentId}-${Date.now() % 1_000_000}`
  writeDb((d) => {
    ;(d.jobLog[studentId] ??= []).unshift({ id, studentId, source: input.portalId ? 'portalFeed' : 'portalOther', portalId: input.portalId, portalName: input.portalName, role: input.role.trim(), company: input.company.trim(), appliedAt: input.appliedAt, status: 'pendingEvidence', outcome: 'applied' })
  })
  return delay(id, 150)
}

/** Attach evidence and run the AI check. Escalations land in the agency evidence queue. */
export async function attachEvidence(studentId: string, entryId: string, input: EvidenceInput, s: ProgrammeSettings, onStage: (i: number) => void, objectUrl?: string): Promise<EvidenceCheckResult> {
  const entry = readDb().jobLog[studentId].find((e) => e.id === entryId)!
  writeDb((d) => {
    const e = d.jobLog[studentId].find((x) => x.id === entryId)!
    e.status = 'checking'
  })
  const result = await checkEvidence(entry, input, s, onStage)
  const evId = `ev-${entryId}-${Date.now() % 10000}`
  writeDb((d) => {
    d.logEvidence[evId] = previewFor(input, objectUrl)
    const e = d.jobLog[studentId].find((x) => x.id === entryId)!
    e.evidenceId = evId
    e.check = result
    e.status = result.decision === 'autoVerified' ? 'verified' : result.decision === 'escalated' ? 'underReview' : 'rejected'
    e.rejectionReason = result.decision === 'rejected' ? result.reasons[0] : undefined
    d.notifications.unshift({
      id: `n-${evId}`,
      studentId,
      type: 'evidence',
      channel: result.decision === 'rejected' ? ['inApp', 'push'] : ['inApp'],
      body:
        result.decision === 'autoVerified'
          ? { en: `Your application to ${e.company} is verified.`, ms: `Permohonan anda ke ${e.company} telah disahkan.` }
          : result.decision === 'escalated'
            ? { en: `Your application to ${e.company} is with an officer for review.`, ms: `Permohonan anda ke ${e.company} sedang disemak oleh pegawai.` }
            : { en: 'We couldn’t read your evidence. Please re-upload.', ms: 'Kami tidak dapat membaca bukti anda. Sila muat naik semula.' },
      at: '2026-10-07T10:46:00+08:00',
      read: false,
      link: '/s/opportunities?tab=log',
    })
  })
  return result
}

export async function updateOutcome(studentId: string, entryId: string, outcome: LogOutcome) {
  writeDb((d) => {
    const e = d.jobLog[studentId].find((x) => x.id === entryId)
    if (e) e.outcome = outcome
  })
  return delay(true, 120)
}
