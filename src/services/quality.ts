import { AGREEMENT_WEEKLY, FAIRNESS_INSTITUTION, FAIRNESS_STATE, SAMPLE_REVIEWS, type FairnessRow } from '@/data/agency6'
import type { Officer } from '@/types/domain'
import { logAudit } from './audit'
import { delay } from './delay'

// AI quality: a weekly random sample reviewed by people, agreement against a threshold, and a monthly fairness view.

export function getQuality() {
  return delay({ agreement: AGREEMENT_WEEKLY, sample: SAMPLE_REVIEWS, fairnessInstitution: FAIRNESS_INSTITUTION, fairnessState: FAIRNESS_STATE, holds: 214 }, 120)
}

export function reviewSample(officer: Officer, id: string, verdict: 'agree' | 'disagree') {
  logAudit(officer, `Sample review: ${verdict}`, 'aiSample', id)
}

/** Groups whose advanced share sits more than 15% below the weighted average are flagged. */
export function fairnessFlags(rows: FairnessRow[]) {
  const total = rows.reduce((n, r) => n + r.students, 0)
  const avg = rows.reduce((n, r) => n + r.advancedShare * r.students, 0) / total
  return new Set(rows.filter((r) => r.advancedShare < avg * 0.85).map((r) => r.group))
}
