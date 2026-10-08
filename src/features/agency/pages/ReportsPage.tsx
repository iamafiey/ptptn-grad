import { useNavigate } from 'react-router'
import { ArrowRight, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import { reportsForRole } from '@/services/reports'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

/** Report index, scoped by role. */
export default function ReportsPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { role } = useOfficer()
  const reports = reportsForRole(role)

  return (
    <AgencyPage title={t('agency.nav.allReports')} description={t('rp.lead')}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.id} as="article" className="transition-shadow hover:shadow-2">
            <button onClick={() => navigate(`/a/reports/${r.id}`)} className="flex h-full w-full flex-col items-start text-left">
              <span className="flex w-full items-start justify-between gap-3">
                <span className="t-body-strong">{t(`rp.${r.id}.title`)}</span>
                <Chip tone="muted" size="sm">
                  {t(`rp.cadence.${r.cadence}`)}
                </Chip>
              </span>
              <span className="mt-1 t-body-sm text-ink-2">{t(`rp.${r.id}.desc`)}</span>
              <span className="mt-auto flex items-center gap-1 pt-3 t-caption text-ink">
                {t('rp.open')} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
              </span>
            </button>
          </Card>
        ))}
        <Card as="article" className="transition-shadow hover:shadow-2">
          <button onClick={() => navigate('/a/reports/cohort')} className="flex h-full w-full flex-col items-start text-left">
            <span className="flex w-full items-start justify-between gap-3">
              <span className="t-body-strong">{t('agency.nav.cohort')}</span>
              <Users size={16} strokeWidth={1.5} className="text-ink-3" aria-hidden />
            </span>
            <span className="mt-1 t-body-sm text-ink-2">{t('rp.cohort.desc')}</span>
            <span className="mt-auto flex items-center gap-1 pt-3 t-caption text-ink">
              {t('rp.open')} <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </span>
          </button>
        </Card>
      </div>
    </AgencyPage>
  )
}
