import type { ProgrammeSettings } from '@/config/programmeSettings'
import { AGREEMENT_WEEKLY, FAIRNESS_INSTITUTION } from '@/data/agency6'
import { COHORT_BASE, COHORT_CURVES, INSTITUTION_SHARE, MONTHLY, MONTHS, PORTAL_SHARE, REPAYMENT_START, REPORT_DEFS, STATE_SHARE, type ReportId } from '@/data/reports'
import type { I18nKey } from '@/i18n/en'
import type { LocalizedText, Officer, OfficerRole } from '@/types/domain'
import { buildQueueSummaries } from './agencyQueues'
import { logAudit } from './audit'
import { gapInsights } from './coursesAdmin'
import { delay } from './delay'
import { buildPartnerRows } from './partnersAdmin'
import { skillById } from './taxonomy'

// Reports share one pattern: headline numbers with change, one main chart, a breakdown table, filters.
// Filters scale programme totals deterministically; rates move a little per filter so views differ.

export type { ReportId }
export interface ReportFilters {
  cohort: string
  institution: string
  state: string
  months: 3 | 6 | 12
}
export const DEFAULT_FILTERS: ReportFilters = { cohort: 'all', institution: 'all', state: 'all', months: 6 }
export const FILTER_OPTIONS = { cohorts: Object.keys(COHORT_BASE), institutions: Object.keys(INSTITUTION_SHARE), states: Object.keys(STATE_SHARE) }

export type KpiFormat = 'number' | 'percent' | 'days' | 'hours'
export interface Kpi {
  label: I18nKey
  value: number
  previous?: number
  format: KpiFormat
  /** Whether a rise is good news (drives the change chip tone). */
  better: 'up' | 'down'
  text?: string
}
export type Cell = string | number | LocalizedText
export interface ReportChart {
  title: I18nKey
  kind: 'trend' | 'stacked'
  data: Record<string, string | number>[]
  /** For trend: the single y key. For stacked: up to 3 series. */
  series: { key: string; label: I18nKey }[]
  format: 'number' | 'percent'
}
export interface ReportView {
  id: ReportId
  cadence: 'weekly' | 'monthly'
  kpis: Kpi[]
  chart: ReportChart
  table: { title: I18nKey; columns: I18nKey[]; rows: Cell[][] }
  /** Live operational reports ignore cohort / institution / state filters. */
  liveOnly?: boolean
}

export function reportsForRole(role: OfficerRole) {
  return REPORT_DEFS.filter((r) => role === 'superAdmin' || r.audience.includes(role))
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const round1 = (n: number) => Math.round(n * 10) / 10

function scaleOf(f: ReportFilters) {
  const c = f.cohort === 'all' ? 1 : COHORT_BASE[f.cohort].size / Object.values(COHORT_BASE).reduce((n, x) => n + x.size, 0)
  const i = f.institution === 'all' ? 1 : INSTITUTION_SHARE[f.institution]
  const s = f.state === 'all' ? 1 : STATE_SHARE[f.state]
  return c * i * s
}
/** Small deterministic shift for rates (±2 points) so filtered views differ believably. */
const shift = (f: ReportFilters, salt: string) => (f.cohort === 'all' && f.institution === 'all' && f.state === 'all' ? 0 : ((hash(JSON.stringify(f) + salt) % 41) - 20) / 10)

function series(f: ReportFilters, keys: Record<string, number[]>, scale: number, rate = false) {
  const start = MONTHS.length - f.months
  return MONTHS.slice(start).map((m, i) => {
    const row: Record<string, string | number> = { month: m }
    for (const [k, arr] of Object.entries(keys)) row[k] = rate ? round1(arr[start + i] + shift(f, k)) : Math.max(0, Math.round(arr[start + i] * scale))
    return row
  })
}
const last = <T,>(arr: T[]) => arr[arr.length - 1]
const prev = <T,>(arr: T[]) => arr[arr.length - 2]

export function buildReport(id: ReportId, f: ReportFilters, settings: ProgrammeSettings, role: OfficerRole): ReportView {
  const k = scaleOf(f)
  const cadence = REPORT_DEFS.find((r) => r.id === id)!.cadence
  const n = (v: number) => Math.round(v * k)
  const r = (v: number, salt: string) => round1(v + shift(f, salt))

  switch (id) {
    case 'employment': {
      const placed = (i: number) => MONTHLY.placementsPartner[i] + MONTHLY.placementsPortal[i] + MONTHLY.placementsOther[i]
      const cohorts = Object.entries(COHORT_BASE).filter(([c]) => f.cohort === 'all' || c === f.cohort)
      return {
        id,
        cadence,
        kpis: [
          { label: 'rp.k.placements', value: n(placed(11)), previous: n(placed(10)), format: 'number', better: 'up' },
          { label: 'rp.k.medianDays', value: Math.round(r(88, 'd')), previous: Math.round(r(92, 'd')), format: 'days', better: 'down' },
          { label: 'rp.k.placementRate', value: r(63.4, 'pr'), previous: r(61.9, 'pr'), format: 'percent', better: 'up' },
          { label: 'rp.k.partnerShare', value: r((MONTHLY.placementsPartner[11] / placed(11)) * 100, 'ps'), previous: r((MONTHLY.placementsPartner[10] / placed(10)) * 100, 'ps'), format: 'percent', better: 'up' },
        ],
        chart: {
          title: 'rp.c.placementsBySource',
          kind: 'stacked',
          data: series(f, { partner: MONTHLY.placementsPartner, portal: MONTHLY.placementsPortal, other: MONTHLY.placementsOther }, k),
          series: [
            { key: 'partner', label: 'rp.s.partner' },
            { key: 'portal', label: 'rp.s.portal' },
            { key: 'other', label: 'rp.s.other' },
          ],
          format: 'number',
        },
        table: {
          title: 'rp.t.byCohort',
          columns: ['ti.di.cohort', 'rp.col.graduates', 'rp.col.placed', 'rp.col.rate', 'rp.k.medianDays', 'rp.col.salary'],
          rows: cohorts.map(([c, b]) => [c, n(b.size), n(b.size * b.placed), `${r(b.placed * 100, c)}%`, b.medianDays, b.medianSalary]),
        },
      }
    }
    case 'jobSearch': {
      const threshold = settings.jobSeeking.monthlyThreshold
      const meets = r(68.2 - (threshold - 4) * 9, 'th')
      return {
        id,
        cadence,
        kpis: [
          { label: 'rp.k.activeSeekers', value: n(last(MONTHLY.activeSeekers)), previous: n(prev(MONTHLY.activeSeekers)), format: 'number', better: 'up' },
          { label: 'rp.k.verifiedApps', value: n(last(MONTHLY.verifiedApps)), previous: n(prev(MONTHLY.verifiedApps)), format: 'number', better: 'up' },
          { label: 'rp.k.meetsThreshold', value: meets, previous: round1(meets - 1.4), format: 'percent', better: 'up', text: String(threshold) },
          { label: 'rp.k.autoVerified', value: r(86.5, 'av'), previous: r(85.9, 'av'), format: 'percent', better: 'up' },
        ],
        chart: { title: 'rp.c.verifiedApps', kind: 'trend', data: series(f, { value: MONTHLY.verifiedApps }, k), series: [{ key: 'value', label: 'rp.k.verifiedApps' }], format: 'number' },
        table: {
          title: 'rp.t.portals',
          columns: ['po.col.portal', 'rp.col.applications', 'rp.col.share'],
          rows: PORTAL_SHARE.map((p) => [p.portal, n(last(MONTHLY.verifiedApps) * p.share), `${Math.round(p.share * 100)}%`]),
        },
      }
    }
    case 'repayment': {
      return {
        id,
        cadence,
        kpis: [
          { label: 'rp.k.tierAShare', value: r(last(MONTHLY.tierAShare), 'ta'), previous: r(prev(MONTHLY.tierAShare), 'ta'), format: 'percent', better: 'up' },
          { label: 'rp.k.recoveries', value: n(last(MONTHLY.recoveries)), previous: n(prev(MONTHLY.recoveries)), format: 'number', better: 'up' },
          { label: 'rp.k.startPlaced', value: r(85.1, 'sp'), previous: r(84.3, 'sp'), format: 'percent', better: 'up' },
          { label: 'rp.k.startSearching', value: r(26.4, 'ss'), previous: r(25.8, 'ss'), format: 'percent', better: 'up' },
          { label: 'rp.k.deferments', value: n(last(MONTHLY.deferments)), previous: n(prev(MONTHLY.deferments)), format: 'number', better: 'up' },
        ],
        chart: { title: 'rp.c.tierAShare', kind: 'trend', data: series(f, { value: MONTHLY.tierAShare }, 1, true), series: [{ key: 'value', label: 'rp.k.tierAShare' }], format: 'percent' },
        table: {
          title: 'rp.t.repaymentStart',
          columns: ['ai.q.col.group', 'ai.q.col.students', 'rp.col.started', 'rp.k.deferments'],
          rows: REPAYMENT_START.map((g) => [g.group, n(g.students), `${r(g.started * 100, g.group.en)}%`, n(g.deferments)]),
        },
      }
    }
    case 'partnerHealth': {
      const rows = buildPartnerRows()
      const active = rows.filter((x) => x.partner.status === 'active')
      const posted = active.reduce((s, x) => s + x.partner.metrics.rolesPosted, 0)
      const committed = active.reduce((s, x) => s + x.committedToDate, 0)
      const responding = active.filter((x) => x.partner.metrics.invitations > 0)
      const avgResp = Math.round(responding.reduce((s, x) => s + x.partner.metrics.avgResponseHours, 0) / Math.max(1, responding.length))
      const weekly = [212, 228, 219, 241, 236, 252, 260, 247, 268, 274, 281, 290]
      return {
        id,
        cadence,
        liveOnly: true,
        kpis: [
          { label: 'rp.k.activePartners', value: active.length, previous: active.length, format: 'number', better: 'up' },
          { label: 'rp.k.postedVsCommitted', value: round1((posted / Math.max(1, committed)) * 100), previous: round1((posted / Math.max(1, committed)) * 100 - 3.2), format: 'percent', better: 'up' },
          { label: 'pa.col.response', value: avgResp, previous: avgResp + 4, format: 'hours', better: 'down' },
          { label: 'pa.col.hires', value: rows.reduce((s, x) => s + x.partner.metrics.hires, 0), previous: rows.reduce((s, x) => s + x.partner.metrics.hires, 0) - 6, format: 'number', better: 'up' },
        ],
        chart: {
          title: 'rp.c.invitationsWeekly',
          kind: 'trend',
          data: weekly.slice(12 - f.months).map((v, i) => ({ month: `W${30 + i + (12 - f.months)}`, value: v })),
          series: [{ key: 'value', label: 'ma.invitations' }],
          format: 'number',
        },
        table: {
          title: 'rp.t.partners',
          columns: ['pa.col.partner', 'pa.col.roles', 'pa.col.response', 'pa.col.hires', 'pa.col.complaints'],
          rows: rows.map((x) => [x.partner.name, `${x.partner.metrics.rolesPosted} / ${x.committedToDate}`, x.partner.metrics.invitations ? `${x.partner.metrics.avgResponseHours} h` : '—', x.partner.metrics.hires, x.partner.metrics.complaints]),
        },
      }
    }
    case 'skillsLearning': {
      const gaps = gapInsights()
      return {
        id,
        cadence,
        kpis: [
          { label: 'rp.k.enrolments', value: n(last(MONTHLY.enrolments)), previous: n(prev(MONTHLY.enrolments)), format: 'number', better: 'up' },
          { label: 'rp.k.completions', value: n(last(MONTHLY.completions)), previous: n(prev(MONTHLY.completions)), format: 'number', better: 'up' },
          { label: 'rp.k.completionRate', value: r((last(MONTHLY.completions) / last(MONTHLY.enrolments)) * 100, 'cr'), previous: r((prev(MONTHLY.completions) / prev(MONTHLY.enrolments)) * 100, 'cr'), format: 'percent', better: 'up' },
          { label: 'rp.k.levelGains', value: n(last(MONTHLY.levelGains)), previous: n(prev(MONTHLY.levelGains)), format: 'number', better: 'up' },
        ],
        chart: { title: 'rp.c.completions', kind: 'trend', data: series(f, { value: MONTHLY.completions }, k), series: [{ key: 'value', label: 'rp.k.completions' }], format: 'number' },
        table: {
          title: 'rp.t.gaps',
          columns: ['le.gap.skill', 'rp.col.demandScore', 'le.gap.courses'],
          rows: gaps.map((g) => [skillById(g.skillId)?.name ?? { en: g.skillId }, g.score, g.courses]),
        },
      }
    }
    case 'aiQuality': {
      return {
        id,
        cadence,
        kpis: [
          { label: 'ai.q.agreement', value: last(AGREEMENT_WEEKLY).agreement, previous: prev(AGREEMENT_WEEKLY.map((w) => w.agreement)), format: 'percent', better: 'up' },
          { label: 'rp.k.autoVerifyAccuracy', value: r(last(MONTHLY.autoVerifyAccuracy), 'aa'), previous: r(prev(MONTHLY.autoVerifyAccuracy), 'aa'), format: 'percent', better: 'up' },
          { label: 'rp.k.disputes', value: n(last(MONTHLY.disputes)), previous: n(prev(MONTHLY.disputes)), format: 'number', better: 'down' },
          { label: 'ai.q.holds', value: n(214), previous: n(198), format: 'number', better: 'down' },
        ],
        chart: { title: 'rp.c.agreement', kind: 'trend', data: series(f, { value: MONTHLY.agreement }, 1, true), series: [{ key: 'value', label: 'ai.q.agreement' }], format: 'percent' },
        table: {
          title: 'ai.q.fairnessInst',
          columns: ['ai.q.col.group', 'ai.q.col.students', 'ai.q.col.advanced', 'ai.q.col.confidence', 'ai.q.col.disputes'],
          rows: FAIRNESS_INSTITUTION.map((g) => [g.group, n(g.students), `${Math.round(g.advancedShare * 100)}%`, g.avgConfidence.toFixed(2), `${(g.disputeRate * 100).toFixed(1)}%`]),
        },
      }
    }
    case 'operations': {
      const queues = buildQueueSummaries(role === 'superAdmin' ? role : 'superAdmin', settings)
      const open = queues.reduce((s, q) => s + q.count, 0)
      const overdue = queues.reduce((s, q) => s + q.overdue, 0)
      return {
        id,
        cadence,
        liveOnly: true,
        kpis: [
          { label: 'rp.k.handled', value: last(MONTHLY.handled), previous: prev(MONTHLY.handled), format: 'number', better: 'up' },
          { label: 'rp.k.slaHit', value: last(MONTHLY.slaHit), previous: prev(MONTHLY.slaHit), format: 'percent', better: 'up' },
          { label: 'rp.k.openNow', value: open, format: 'number', better: 'down' },
          { label: 'rp.k.overdueNow', value: overdue, format: 'number', better: 'down' },
        ],
        chart: { title: 'rp.c.handled', kind: 'trend', data: series(f, { value: MONTHLY.handled }, 1), series: [{ key: 'value', label: 'rp.k.handled' }], format: 'number' },
        table: {
          title: 'rp.t.queues',
          columns: ['rp.col.queue', 'rp.col.open', 'rp.col.overdue', 'rp.col.oldest', 'rp.col.slaTarget'],
          rows: queues.map((q) => [q.def.title, q.count, q.overdue, q.oldest, q.def.slaWorkingDays]),
        },
      }
    }
  }
}

export function getReport(id: ReportId, f: ReportFilters, s: ProgrammeSettings, role: OfficerRole) {
  return delay(buildReport(id, f, s, role), 160)
}

export function logExport(officer: Officer, id: ReportId, format: 'pdf' | 'csv') {
  logAudit(officer, `Exported report (${format.toUpperCase()})`, 'report', id)
}

/** Cohort view: share of the cohort visible (not yet hired), hired (not yet repaying) and repaying, by month since graduation. */
export function cohortView(cohort: string) {
  const c = COHORT_CURVES[cohort]
  const base = COHORT_BASE[cohort]
  const months = c.visible.map((_, i) => ({
    month: `M${i + 1}`,
    visible: Math.round(c.visible[i] * 100),
    hired: Math.round(c.hired[i] * 100),
    repaying: Math.round(c.repaying[i] * 100),
  }))
  const lastRow = months[months.length - 1]
  const firstHalf = c.hired.findIndex((h, i) => h + c.repaying[i] >= 0.5)
  return {
    size: base.size,
    months,
    everHired: Math.round(base.placed * 100),
    repayingNow: lastRow.repaying,
    medianMonthsToHire: firstHalf === -1 ? null : firstHalf + 1,
  }
}
export const COHORTS = Object.keys(COHORT_CURVES).sort()
