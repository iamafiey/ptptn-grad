import { useParams } from 'react-router'
import { PhasePlaceholder } from '@/components/PhasePlaceholder'
import { useT } from '@/i18n'
import type { I18nKey } from '@/i18n/en'
import type { LocalizedText } from '@/types/domain'
import { AgencyPage } from '../shell/AgencyPage'

type Meta = { title: I18nKey; phase: number; plan: LocalizedText[] }

// Phase 1b stand-ins for every agency screen (docs/admin-dashboard-flow.md), replaced phase by phase.
const PAGES = {
  partners: { title: 'agency.nav.talentPartners', phase: 6, plan: [{ en: 'Directory with commitment tracker; Pause, End, Renew, Add note.' }] },
  partner: { title: 'agency.page.partner', phase: 6, plan: [{ en: 'Onboarding stages, verification chips, commitments, roles, reports.' }] },
  portals: { title: 'agency.nav.portalFeeds', phase: 6, plan: [{ en: 'Feed agreements, last sync, listings imported, feed rules, curated portal list.' }] },
  matching: { title: 'agency.nav.matching', phase: 6, plan: [{ en: 'Views, invitations, acceptances, hires; “unseen students” in 60 days.' }] },
  students: { title: 'agency.nav.directory', phase: 6, plan: [{ en: 'Masked directory with filters; opening a record is logged.' }] },
  student: { title: 'agency.page.student', phase: 6, plan: [{ en: 'Student and employer views, skills with explainability, timeline, tier badge only.' }] },
  disputes: { title: 'agency.nav.disputes', phase: 6, plan: [{ en: 'Evidence, AI rationale and student comment side by side; Uphold, Correct, Request evidence.' }] },
  flags: { title: 'agency.nav.flags', phase: 6, plan: [{ en: 'Duplicate IC, reused evidence, score jumps, partner reports.' }] },
  learn: { title: 'agency.nav.learn', phase: 6, plan: [{ en: 'Course catalogue, add course with AI-suggested skills, providers, gap insights.' }] },
  taxonomy: { title: 'agency.nav.taxonomy', phase: 6, plan: [{ en: 'Category → skill tree with rubric levels; drafts and published versions.' }] },
  rubric: { title: 'agency.nav.rubric', phase: 6, plan: [{ en: 'Draft → impact preview → second approver → publish.' }] },
  evidenceRules: { title: 'agency.nav.evidenceRules', phase: 6, plan: [{ en: 'Evidence checks and the auto-verify confidence threshold.' }] },
  quality: { title: 'agency.nav.quality', phase: 6, plan: [{ en: 'Weekly sample review, agreement threshold alert, fairness view.' }] },
  tiers: { title: 'agency.nav.tierRules', phase: 6, plan: [{ en: 'Versioned rules → impact preview → second approver → scheduled effect.' }] },
  sync: { title: 'agency.nav.sync', phase: 6, plan: [{ en: 'Last sync, records, errors; no downgrades on missing data.' }] },
  overrides: { title: 'agency.nav.overrides', phase: 6, plan: [{ en: 'Restore Tier A for a fixed period with proof; auto-expiry.' }] },
  distribution: { title: 'agency.nav.distribution', phase: 6, plan: [{ en: 'Tier share by cohort; monthly Tier B → A recoveries.' }] },
  reports: { title: 'agency.nav.allReports', phase: 7, plan: [{ en: 'Seven reports scoped by role, export PDF and Excel.' }] },
  report: { title: 'agency.page.report', phase: 7, plan: [{ en: 'Headline numbers, one main chart, breakdown table, filters.' }] },
  cohort: { title: 'agency.nav.cohort', phase: 7, plan: [{ en: 'Follow a graduation cohort: visible → hired → repaying.' }] },
  settings: { title: 'agency.nav.settings', phase: 7, plan: [{ en: 'Roles, programme settings (open decisions), audit log, PDPA, integrations, safety.' }] },
} satisfies Record<string, Meta>

export type AgencyPageId = keyof typeof PAGES

export function AgencyPlaceholder({ page }: { page: AgencyPageId }) {
  const { t } = useT()
  const params = useParams()
  const meta: Meta = PAGES[page]
  const id = params.queueId ?? params.partnerId ?? params.studentId ?? params.reportId
  return (
    <AgencyPage title={id ? `${t(meta.title)} · ${id}` : t(meta.title)}>
      <div className="max-w-2xl">
        <PhasePlaceholder phase={meta.phase} items={meta.plan} />
      </div>
    </AgencyPage>
  )
}
