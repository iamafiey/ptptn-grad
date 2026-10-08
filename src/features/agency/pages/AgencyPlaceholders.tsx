import { useParams } from 'react-router'
import { PhasePlaceholder } from '@/components/PhasePlaceholder'
import { useT } from '@/i18n'
import type { I18nKey } from '@/i18n/en'
import type { LocalizedText } from '@/types/domain'
import { AgencyPage } from '../shell/AgencyPage'

type Meta = { title: I18nKey; phase: number; plan: LocalizedText[] }

// Phase 1b stand-ins for every agency screen (docs/admin-dashboard-flow.md), replaced phase by phase.
const PAGES = {
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
