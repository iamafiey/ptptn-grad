import type { ProgrammeSettings } from '@/config/programmeSettings'
import { EVIDENCE_SAMPLES, type EvidenceSample } from '@/data/jobLog'
import type { EvidenceCheckResult, JobLogEntry, LocalizedText } from '@/types/domain'
import { delay } from './delay'

// Simulated AI evidence check (docs/admin-dashboard-flow.md §Evidence verification):
// extract company, role, portal, date → confirm company exists → check the date → detect edited/reused images.
// Auto-verify only when every check passes and confidence clears the configured threshold.

export type EvidenceInput = { sampleId: string } | { fileName: string; size: number }

export interface CheckStage {
  key: 'reading' | 'extracting' | 'company' | 'date' | 'integrity'
  label: LocalizedText
}

export const CHECK_STAGES: CheckStage[] = [
  { key: 'reading', label: { en: 'Reading the file', ms: 'Membaca fail' } },
  { key: 'extracting', label: { en: 'Extracting company, role, portal and date', ms: 'Mengekstrak syarikat, peranan, portal dan tarikh' } },
  { key: 'company', label: { en: 'Confirming the company exists', ms: 'Mengesahkan syarikat wujud' } },
  { key: 'date', label: { en: 'Checking the date is in this period', ms: 'Menyemak tarikh dalam tempoh ini' } },
  { key: 'integrity', label: { en: 'Checking for edited or reused images', ms: 'Menyemak imej disunting atau digunakan semula' } },
]

export function listEvidenceSamples() {
  return EVIDENCE_SAMPLES
}

/** Real uploads get a repeatable outcome from their name and size (no randomness). */
function outcomeForUpload(fileName: string, size: number): EvidenceSample['outcome'] {
  const h = [...`${fileName}:${size}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 10
  return h < 6 ? 'verified' : h < 8 ? 'companyNotFound' : 'unreadable'
}

export function previewFor(input: EvidenceInput, objectUrl?: string) {
  if ('sampleId' in input) {
    const s = EVIDENCE_SAMPLES.find((x) => x.id === input.sampleId)!
    return { fileName: s.fileName, previewUrl: s.previewUrl }
  }
  return { fileName: input.fileName, previewUrl: objectUrl ?? '/evidence/photo.svg' }
}

export async function checkEvidence(
  entry: Pick<JobLogEntry, 'id' | 'company' | 'role' | 'portalName' | 'appliedAt'>,
  input: EvidenceInput,
  s: ProgrammeSettings,
  onStage: (i: number) => void,
): Promise<EvidenceCheckResult> {
  for (let i = 0; i < CHECK_STAGES.length; i++) {
    onStage(i)
    await delay(null, 520)
  }
  const outcome = 'sampleId' in input ? EVIDENCE_SAMPLES.find((x) => x.id === input.sampleId)!.outcome : outcomeForUpload(input.fileName, input.size)
  const base = { company: entry.company, role: entry.role, portal: entry.portalName, date: entry.appliedAt }
  const checks: EvidenceCheckResult['checks'] = { readable: 'pass', companyExists: 'pass', matchesEntry: 'pass', dateInPeriod: 'pass', duplicateImage: 'pass', editedImage: 'pass' }
  const result = (confidence: number, extracted: EvidenceCheckResult['extracted'], over: Partial<EvidenceCheckResult['checks']>, reasons: LocalizedText[]): EvidenceCheckResult => {
    const allPass = Object.values({ ...checks, ...over }).every((c) => c === 'pass')
    const decision: EvidenceCheckResult['decision'] = over.readable === 'fail' ? 'rejected' : allPass && confidence >= s.evidence.autoVerifyConfidence ? 'autoVerified' : 'escalated'
    const extraReasons: LocalizedText[] =
      allPass && decision === 'escalated'
        ? [{ en: `Confidence ${Math.round(confidence * 100)}% is below the auto-verify threshold of ${Math.round(s.evidence.autoVerifyConfidence * 100)}%. An officer will check it.`, ms: `Keyakinan ${Math.round(confidence * 100)}% di bawah ambang pengesahan automatik ${Math.round(s.evidence.autoVerifyConfidence * 100)}%. Pegawai akan menyemaknya.` }]
        : []
    return {
      checkId: `chk-${entry.id}-${Date.now() % 10000}`,
      modelVersion: 'evidencecheck-0.9 (on-prem)',
      checkedAt: '2026-10-07T10:45:00+08:00',
      confidence,
      extracted,
      checks: { ...checks, ...over },
      decision,
      reasons: [...reasons, ...extraReasons],
    }
  }

  switch (outcome) {
    case 'verified':
      return result(0.94, base, {}, [])
    case 'unreadable':
      return result(0.31, { portal: entry.portalName }, { readable: 'fail', matchesEntry: 'warn' }, [
        { en: 'We couldn’t read your file. Please re-upload a clearer screenshot or the original email.', ms: 'Kami tidak dapat membaca fail anda. Sila muat naik tangkapan skrin yang lebih jelas atau e-mel asal.' },
      ])
    case 'companyNotFound':
      return result(0.62, { ...base, company: 'Syarikat Cahaya Timur Logistik' }, { companyExists: 'warn', matchesEntry: entry.company.toLowerCase().includes('cahaya timur') ? 'pass' : 'warn' }, [
        { en: 'We couldn’t find this company in the business registry. An officer will check it.', ms: 'Kami tidak menjumpai syarikat ini dalam daftar perniagaan. Pegawai akan menyemaknya.' },
      ])
    case 'edited':
      return result(0.58, base, { editedImage: 'warn' }, [
        { en: 'Parts of this image may have been edited. An officer will check it.', ms: 'Sebahagian imej ini mungkin telah disunting. Pegawai akan menyemaknya.' },
      ])
    case 'oldDate':
      return result(0.66, { ...base, date: '2025-03-14' }, { dateInPeriod: 'fail' }, [
        { en: `The date on this evidence is outside the last ${s.evidence.applicationPeriodDays} days. An officer will check it.`, ms: `Tarikh pada bukti ini di luar ${s.evidence.applicationPeriodDays} hari lepas. Pegawai akan menyemaknya.` },
      ])
  }
}
