import { OPEN_JOBS, PORTALS } from '@/data/jobs'
import type { OpenJob, Portal } from '@/types/domain'
import type { ProgrammeSettings } from '@/config/programmeSettings'
import { readDb, writeDb } from './db'
import { delay } from './delay'
import { matchJob } from './matching'

// Open jobs from portals with data agreements. A portal set to link-out shows no feed,
// only a curated entry with search shortcuts. No scraping.

export interface OpenJobView extends OpenJob {
  portal: Portal
}

export function portalMode(p: Portal, s: ProgrammeSettings) {
  return s.portals[p.id] ?? (p.agreement === 'activeFeed' ? 'feed' : 'linkOut')
}

export function buildOpenJobs(studentId: string, s: ProgrammeSettings): OpenJobView[] {
  const skills = readDb().students[studentId]?.skills ?? []
  return OPEN_JOBS.map((j) => ({ ...j, portal: PORTALS.find((p) => p.id === j.portalId)! }))
    .filter((j) => portalMode(j.portal, s) === 'feed')
    .map((j) => ({ ...j, matchPct: matchJob(j, skills).pct }))
    .sort((a, b) => b.matchPct - a.matchPct || b.postedAt.localeCompare(a.postedAt))
}

export function listOpenJobs(studentId: string, s: ProgrammeSettings) {
  return delay(buildOpenJobs(studentId, s), 180)
}

export function listLinkOutPortals(s: ProgrammeSettings) {
  return PORTALS.filter((p) => portalMode(p, s) === 'linkOut')
}

export function listPortals() {
  return PORTALS
}

/** Applying links out to the source portal; the click is recorded as a pending log entry. */
export async function applyOnPortal(studentId: string, jobId: string) {
  const job = OPEN_JOBS.find((j) => j.id === jobId)!
  const portal = PORTALS.find((p) => p.id === job.portalId)!
  const id = `log-${studentId}-${jobId}`
  writeDb((d) => {
    const log = (d.jobLog[studentId] ??= [])
    if (log.some((e) => e.id === id)) return
    log.unshift({ id, studentId, source: 'portalFeed', portalId: portal.id, portalName: portal.name, role: job.title, company: job.company, appliedAt: '2026-10-07', status: 'pendingEvidence', outcome: 'applied' })
  })
  return delay({ entryId: id, url: job.externalUrl, portal: portal.name }, 300)
}
