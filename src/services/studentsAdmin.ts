import { DIRECTORY, type DirectoryStudent } from '@/data/agency6'
import type { Officer } from '@/types/domain'
import { studentCode } from './agencyQueues'
import { logAudit } from './audit'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { computeStrength } from './students'

// Agency student oversight. Names and ICs are masked until a record is opened, and every reveal is logged.
// Officers never hand-edit a skill score: corrections go through evidence and re-scoring.

const DEMO_INST_TYPE = 'Public university' as const

/** Directory rows: the three demo students (live data) plus 60 synthetic graduates. */
export function buildDirectory(): DirectoryStudent[] {
  const d = readDb()
  const demo: DirectoryStudent[] = Object.values(d.students).map((s) => {
    const st = s.student
    const log = d.jobLog[st.id] ?? []
    const inv = d.invitations.filter((i) => i.studentId === st.id && i.stage !== 'declined').length
    return {
      id: st.id,
      code: studentCode(st.id),
      name: st.fullName,
      icMasked: st.icMasked,
      institution: st.institution,
      institutionType: DEMO_INST_TYPE,
      programme: st.programme,
      graduationYear: st.graduationYear,
      state: st.state,
      cohort: String(st.graduationYear),
      profileStrength: computeStrength(s).pct,
      visible: st.onboardingStep === 'done' && st.visibility.partnersCanFind && !d.pausedVisibility.includes(st.id),
      skillsCount: s.skills?.length ?? 0,
      invitations: inv,
      jobSearchEntries: log.length,
      stage: st.onboardingStep === 'done' ? (inv ? 'talking' : 'visible') : 'onboarding',
      lastActive: st.lastActive,
      tier: d.repayment[st.id]?.status === 'behind' && !d.overrides.some((o) => o.studentId === st.id && o.status === 'active') ? 'B' : 'A',
      topSkills: (s.skills ?? []).slice(0, 3).map((k) => ({ skillId: k.skillId, level: k.level })),
      demo: true,
    }
  })
  return [...demo, ...DIRECTORY]
}

export function listStudents() {
  return delay(buildDirectory(), 150)
}

export function getStudentRecord(id: string) {
  const row = buildDirectory().find((s) => s.id === id)
  const d = readDb()
  return delay(row ? { row, seed: d.students[id] ?? null, log: d.jobLog[id] ?? [], notes: d.studentNotes[id] ?? [], invitations: d.invitations.filter((i) => i.studentId === id), paused: d.pausedVisibility.includes(id) } : null, 140)
}

/** Unmasking a name or IC is always logged with a reason. */
export function revealIdentity(officer: Officer, id: string, reason: string) {
  logAudit(officer, 'Revealed student name and IC', 'student', studentCode(id), reason)
}

export async function addStudentNote(officer: Officer, id: string, body: string) {
  writeDb((d) => (d.studentNotes[id] ??= []).unshift({ by: officer.name, at: '2026-10-07', body }))
  logAudit(officer, 'Added support note', 'student', studentCode(id), body)
  return delay(true, 120)
}

export async function toggleVisibilityPause(officer: Officer, id: string, reason: string) {
  const paused = readDb().pausedVisibility.includes(id)
  writeDb((d) => {
    d.pausedVisibility = paused ? d.pausedVisibility.filter((x) => x !== id) : [...d.pausedVisibility, id]
  })
  logAudit(officer, paused ? 'Resumed student visibility' : 'Paused student visibility', 'student', studentCode(id), reason, () =>
    writeDb((d) => {
      d.pausedVisibility = paused ? [...d.pausedVisibility, id] : d.pausedVisibility.filter((x) => x !== id)
    }),
  )
  return delay(true, 150)
}

export async function triggerRescore(officer: Officer, id: string) {
  logAudit(officer, 'Triggered re-score', 'student', studentCode(id), 'Officer request')
  return delay(true, 1200)
}

export async function messageStudent(officer: Officer, id: string, body: string) {
  writeDb((d) => {
    if (d.students[id]) d.notifications.unshift({ id: `n-msg-${Date.now() % 100000}`, studentId: id, type: 'newMatches', channel: ['inApp'], body: { en: `PTPTN: ${body}`, ms: `PTPTN: ${body}` }, at: '2026-10-07T13:00:00+08:00', read: false })
  })
  logAudit(officer, 'Messaged student', 'student', studentCode(id), body)
  return delay(true, 150)
}

export function listFlags() {
  return delay(readDb().flags, 100)
}
