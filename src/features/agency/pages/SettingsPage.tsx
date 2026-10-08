import { useSearchParams } from 'react-router'
import { Note } from '@/components/ui/Note'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { AuditTab } from '../settings/AuditTab'
import { IntegrationsTab } from '../settings/IntegrationsTab'
import { PdpaTab } from '../settings/PdpaTab'
import { ProgrammeTab } from '../settings/ProgrammeTab'
import { RolesTab } from '../settings/RolesTab'
import { SafetyTab } from '../settings/SafetyTab'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const TABS = ['programme', 'roles', 'audit', 'pdpa', 'integrations', 'safety'] as const
type Tab = (typeof TABS)[number]

/** Settings (super admin): roles, programme settings (open decisions), audit log, PDPA, integrations, safety. */
export default function SettingsPage() {
  const { t } = useT()
  const { officer, readOnly } = useOfficer()
  const [params, setParams] = useSearchParams()
  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'programme'
  const canEdit = !readOnly

  return (
    <AgencyPage title={t('agency.nav.settings')} description={t('se.lead')}>
      <div role="tablist" aria-label={t('agency.nav.settings')} className="mb-5 flex gap-1 overflow-x-auto border-b border-hairline">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setParams({ tab: k }, { replace: true })}
            className={cn('-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 t-body-sm', tab === k ? 'border-ink text-ink t-body-strong' : 'border-transparent text-ink-2 hover:text-ink')}
          >
            {t(`se.tab.${k}`)}
          </button>
        ))}
      </div>
      {readOnly && <Note tone="muted" className="mb-4">{t('ag.readOnlyNote')}</Note>}
      {tab === 'programme' && <ProgrammeTab officer={officer} canEdit={canEdit} />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'audit' && <AuditTab officer={officer} />}
      {tab === 'pdpa' && <PdpaTab officer={officer} canEdit={canEdit} />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'safety' && <SafetyTab officer={officer} canEdit={canEdit} />}
    </AgencyPage>
  )
}
