import { Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { PortalMode } from '@/config/programmeSettings'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { logAudit } from '@/services/audit'
import { listPortalRows } from '@/services/partnersAdmin'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const HEALTH_TONE: Record<string, ChipTone> = { ok: 'done', stale: 'pending', failed: 'attention' }

/** Portal feed agreements. "Students see" is a programme setting: feed listings or a curated link-out. */
export default function PortalsPage() {
  const { t, lang } = useT()
  const toast = useToast()
  const { settings, updateSettings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const rows = listPortalRows(settings)
  const canAct = !readOnly && (role === 'partnershipManager' || role === 'superAdmin')

  const setMode = (id: string, name: string, mode: PortalMode) => {
    updateSettings((s) => ({ ...s, portals: { ...s.portals, [id]: mode } }))
    logAudit(officer, `Portal set to ${mode}`, 'portal', id, name)
    toast(t('po.modeChanged', { portal: name, mode: t(`po.mode.${mode}`) }))
  }

  return (
    <AgencyPage title={t('agency.nav.portalFeeds')} description={t('po.lead')}>
      {!canAct && <Note tone="muted" className="mb-4">{readOnly ? t('ag.readOnlyNote') : t('ag.noWorkQueue')}</Note>}
      <Card padded={false} className="overflow-hidden">
        <Table minWidth={920}>
          <THead>
            <Th>{t('po.col.portal')}</Th>
            <Th>{t('po.col.agreement')}</Th>
            <Th>{t('po.col.lastSync')}</Th>
            <Th>{t('po.col.listings')}</Th>
            <Th>{t('po.col.health')}</Th>
            <Th>{t('po.col.mode')}</Th>
          </THead>
          <tbody>
            {rows.map(({ portal: p, mode, reported }) => (
              <Tr key={p.id}>
                <Td>
                  <span className="flex items-center gap-3">
                    <LogoTile monogram={p.monogram} size={32} />
                    <span className="t-body-strong">{p.name}</span>
                  </span>
                </Td>
                <Td>{t(`po.agreement.${p.agreement}`)}</Td>
                <Td className="whitespace-nowrap">{p.lastSyncAt ? formatDate(p.lastSyncAt, lang, 'weekday') : '—'}</Td>
                <Td className="tabular">
                  {formatNumber(p.listingsImported)}
                  {reported > 0 && <span className="ml-2 t-caption text-ink-3">· {t('po.reportedCount', { count: reported })}</span>}
                </Td>
                <Td>
                  <Chip tone={HEALTH_TONE[p.feedHealth]} size="sm">
                    {t(`po.health.${p.feedHealth}`)}
                  </Chip>
                </Td>
                <Td>
                  {canAct && p.agreement === 'activeFeed' ? (
                    <SegmentedControl<PortalMode>
                      ariaLabel={`${t('po.col.mode')} · ${p.name}`}
                      className="w-56"
                      value={mode}
                      onChange={(m) => setMode(p.id, p.name, m)}
                      options={[
                        { value: 'feed', label: t('po.mode.feed') },
                        { value: 'linkOut', label: t('po.mode.linkOut') },
                      ]}
                    />
                  ) : (
                    t(`po.mode.${mode}`)
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionLabel className="mb-3">{t('po.rules')}</SectionLabel>
          <ul className="space-y-2">
            {(['malaysia', 'entry', 'salary', 'noFee'] as const).map((k) => (
              <li key={k} className="flex items-center gap-2 t-body-sm">
                <Check size={16} strokeWidth={1.5} className="text-done-ink" aria-hidden />
                {t(`po.rule.${k}`)}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="t-body-sm text-ink-2">{t('po.reported')}</p>
        </Card>
      </div>
    </AgencyPage>
  )
}
