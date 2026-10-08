import type { DisputeCase } from '@/data/agency6'
import type { Officer, SkillLevel } from '@/types/domain'
import { studentCode } from './agencyQueues'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'

// Skill disputes (docs §Skill disputes): evidence, AI rationale and student comment side by side.
// Uphold · Correct (fix mapping, re-score) · Request evidence; mapping errors can be flagged as taxonomy issues.

export interface DisputeView extends DisputeCase {
  studentId?: string
}

/** Live disputes from demo students (skill status 'disputed') plus seeded synthetic cases. */
export function buildDisputes(): DisputeView[] {
  const d = readDb()
  const real: DisputeView[] = Object.values(d.students).flatMap((s) =>
    (s.skills ?? [])
      .filter((k) => k.status === 'disputed')
      .map((k) => ({
        id: `SD-${s.student.id}-${k.skillId}`,
        studentId: s.student.id,
        studentCode: studentCode(s.student.id),
        skillId: k.skillId,
        level: k.level,
        claimed: (k.level === 'foundation' ? 'working' : 'advanced') as SkillLevel,
        reason: 'level' as const,
        comment: s.student.id === 'hafiz' ? 'My FYP route model cut distance by 18%. I think this should be Working.' : 'I think this level is wrong.',
        aiRationale: k.rationale.en,
        evidence: k.evidenceIds.map((e) => s.activities.find((a) => a.id === e)?.role ?? s.evidence.find((x) => x.id === e)?.fileName ?? e),
        openedAt: '2026-10-05',
        status: 'open' as const,
      })),
  )
  return [...real, ...d.disputes.filter((x) => x.status === 'open')]
}

export function listDisputes() {
  return delay(buildDisputes(), 140)
}

export async function resolveDispute(officer: Officer, dispute: DisputeView, outcome: 'upheld' | 'corrected' | 'evidenceRequested', note: string, taxonomyIssue: boolean) {
  if (dispute.studentId) {
    const sid = dispute.studentId
    const before = structuredClone(readDb().students[sid].skills!.find((k) => k.skillId === dispute.skillId)!)
    writeDb((d) => {
      const k = d.students[sid].skills!.find((x) => x.skillId === dispute.skillId)!
      if (outcome === 'corrected') {
        k.level = dispute.claimed
        k.rubricHits = [...k.rubricHits, 'Officer correction after dispute']
      }
      // Visible to employers again unless more evidence was requested.
      k.status = outcome === 'evidenceRequested' ? 'disputed' : 'kept'
      d.notifications.unshift({
        id: `n-sd-${dispute.skillId}-${outcome}`,
        studentId: sid,
        type: 'rescored',
        channel: ['inApp'],
        body:
          outcome === 'corrected'
            ? { en: `Your dispute was accepted. The level is now ${dispute.claimed}.`, ms: `Pertikaian anda diterima. Tahap kini ${dispute.claimed}.` }
            : outcome === 'upheld'
              ? { en: 'Your dispute was reviewed and the level was kept. The skill is visible again.', ms: 'Pertikaian anda disemak dan tahap dikekalkan.' }
              : { en: 'An officer asked for more evidence for your disputed skill.', ms: 'Pegawai meminta lebih banyak bukti untuk kemahiran yang dipertikaikan.' },
        at: '2026-10-07T13:30:00+08:00',
        read: false,
        link: '/s/profile',
      })
    })
    logAudit(officer, `Dispute ${outcome}${taxonomyIssue ? ' · taxonomy issue flagged' : ''}`, 'dispute', dispute.id, note, () =>
      writeDb((d) => {
        const list = d.students[sid].skills!
        list[list.findIndex((x) => x.skillId === dispute.skillId)] = before
      }),
    )
  } else {
    writeDb((d) => {
      const c = d.disputes.find((x) => x.id === dispute.id)!
      c.status = outcome
      c.taxonomyIssue = taxonomyIssue
    })
    logAudit(officer, `Dispute ${outcome}${taxonomyIssue ? ' · taxonomy issue flagged' : ''}`, 'dispute', dispute.id, note, () =>
      writeDb((d) => {
        d.disputes.find((x) => x.id === dispute.id)!.status = 'open'
      }),
    )
  }
  return delay(true, 300)
}
