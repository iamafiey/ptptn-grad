import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import { listIntegrations } from '@/services/settingsAdmin'

const TONE: Record<string, ChipTone> = { ok: 'done', degraded: 'attention', planned: 'muted' }

/** Integration status: repayment sync, CRM, portals, university records, SSM, messaging. */
export function IntegrationsTab() {
  const { t } = useT()
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {listIntegrations().map((i) => (
        <Card key={i.id} as="article">
          <div className="flex items-start justify-between gap-3">
            <p className="t-body-strong">{t(`se.int.${i.id}`)}</p>
            <Chip tone={TONE[i.status]} size="sm">
              {t(`se.int.s.${i.status}`)}
            </Chip>
          </div>
          <p className="mt-1 t-body-sm text-ink-2">{t(`se.int.${i.id}.detail`)}</p>
        </Card>
      ))}
    </div>
  )
}
