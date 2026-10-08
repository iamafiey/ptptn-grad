import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Toggle } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { ChangeRequestList } from '@/components/agency/ChangeRequestList'
import { SidePanel } from '@/components/agency/SidePanel'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { ProgrammeSettings } from '@/config/programmeSettings'
import { useT } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import type { ChangeRequest } from '@/services/db'
import { proposeChange, tierImpact } from '@/services/governance'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

type TierPatch = { tier: ProgrammeSettings['tier']; tierB: ProgrammeSettings['tierB'] }

/** Tier rules as configuration: propose → impact preview → second approver → scheduled effect with a student notice. */
export default function TierRulesPage() {
  const { t, lang } = useT()
  const toast = useToast()
  const { settings, updateSettings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const [proposing, setProposing] = useState(false)
  const canAct = !readOnly && (role === 'collectionLiaison' || role === 'superAdmin')
  const s = settings
  const tierName = (a: boolean) => (a ? t('ti.v.tierA') : t('ti.v.tierB'))

  const rules: [string, string][] = [
    [t('ti.r.grace'), tierName(s.tier.graceCountsAsTierA)],
    [t('ti.r.missed'), t('ti.v.orMore', { n: s.tier.missedPaymentsForTierB })],
    [t('ti.r.restructured'), tierName(s.tier.restructuredCountsAsTierA)],
    [t('ti.r.partnerRoles'), s.tierB.partnerRoles === 'hidden' ? t('ti.v.hidden') : t('ti.v.window', { days: s.tierB.earlyAccessDays })],
    [t('ti.r.courses'), t(`ti.v.${s.tierB.courses}`)],
    [t('ti.r.restore'), t('ti.v.syncConfirmed')],
    [t('ti.r.threshold'), t('ti.v.thresholdN', { n: s.jobSeeking.monthlyThreshold })],
  ]

  const apply = (cr: ChangeRequest) => {
    const p = cr.patch as TierPatch | undefined
    if (p) updateSettings((x) => ({ ...x, tier: { ...x.tier, ...p.tier }, tierB: { ...x.tierB, ...p.tierB } }))
    toast(t('ti.appliedDemo', { date: formatDate(cr.effectiveAt ?? '2026-10-14', lang, 'long') }))
  }

  return (
    <AgencyPage
      title={t('agency.nav.tierRules')}
      description={t('ti.lead')}
      actions={
        canAct && (
          <Button size="sm" onClick={() => setProposing(true)}>
            {t('ti.propose')}
          </Button>
        )
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card padded={false} className="overflow-hidden">
          <Table minWidth={520}>
            <THead>
              <Th>{t('ti.rule')}</Th>
              <Th>{t('ti.value')}</Th>
            </THead>
            <tbody>
              {rules.map(([k, v]) => (
                <Tr key={k}>
                  <Td className="text-ink-2">{k}</Td>
                  <Td className="t-body-strong">{v}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="min-w-0">
          <ChangeRequestList kind="tierRules" officer={officer} canAct={canAct} onApproved={apply} />
          {canAct && <p className="mt-3 t-caption font-normal text-ink-3">{t('ti.switchHint')}</p>}
        </div>
      </div>

      {proposing && (
        <ProposePanel
          current={settings}
          onClose={() => setProposing(false)}
          onSubmit={async (next, summary) => {
            await proposeChange(officer, { kind: 'tierRules', title: summary, detail: t('ti.noticeText'), patch: { tier: next.tier, tierB: next.tierB } })
            setProposing(false)
            toast(t('ai.rb.pending'))
          }}
        />
      )}
    </AgencyPage>
  )
}

function ProposePanel({ current, onClose, onSubmit }: { current: ProgrammeSettings; onClose: () => void; onSubmit: (next: ProgrammeSettings, summary: string) => void }) {
  const { t } = useT()
  const [next, setNext] = useState<ProgrammeSettings>(current)
  const setTier = (p: Partial<ProgrammeSettings['tier']>) => setNext((x) => ({ ...x, tier: { ...x.tier, ...p } }))
  const setTierB = (p: Partial<ProgrammeSettings['tierB']>) => setNext((x) => ({ ...x, tierB: { ...x.tierB, ...p } }))
  const impact = tierImpact(current, next)

  const changes: string[] = []
  if (next.tier.graceCountsAsTierA !== current.tier.graceCountsAsTierA) changes.push(`${t('ti.r.grace')} ${next.tier.graceCountsAsTierA ? t('ti.v.tierA') : t('ti.v.tierB')}`)
  if (next.tier.missedPaymentsForTierB !== current.tier.missedPaymentsForTierB) changes.push(`${t('ti.r.missed')}: ${next.tier.missedPaymentsForTierB}`)
  if (next.tier.restructuredCountsAsTierA !== current.tier.restructuredCountsAsTierA) changes.push(`${t('ti.r.restructured')} ${next.tier.restructuredCountsAsTierA ? t('ti.v.tierA') : t('ti.v.tierB')}`)
  if (next.tierB.partnerRoles !== current.tierB.partnerRoles || next.tierB.earlyAccessDays !== current.tierB.earlyAccessDays)
    changes.push(`${t('ti.r.partnerRoles')}: ${next.tierB.partnerRoles === 'hidden' ? t('ti.v.hidden') : t('ti.v.window', { days: next.tierB.earlyAccessDays })}`)
  if (next.tierB.courses !== current.tierB.courses) changes.push(`${t('ti.r.courses')}: ${t(`ti.v.${next.tierB.courses}`)}`)

  const stats: [string, number][] = [
    [t('ti.aToB'), impact.aToB],
    [t('ti.bToA'), impact.bToA],
    [t('ti.rolesGained'), impact.rolesGained],
    [t('ti.rolesLost'), impact.rolesLost],
  ]

  return (
    <SidePanel
      open
      onClose={onClose}
      title={t('ti.proposeTitle')}
      closeLabel={t('ag.panel.close')}
      width={620}
      footer={
        <div className="flex justify-end">
          <Button size="sm" disabled={changes.length === 0} onClick={() => onSubmit(next, changes.join('; '))}>
            {t('ai.rb.submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Toggle checked={next.tier.graceCountsAsTierA} onChange={(v) => setTier({ graceCountsAsTierA: v })} label={t('ti.r.grace')} description={next.tier.graceCountsAsTierA ? t('ti.v.tierA') : t('ti.v.tierB')} />
        <Toggle checked={next.tier.restructuredCountsAsTierA} onChange={(v) => setTier({ restructuredCountsAsTierA: v })} label={t('ti.r.restructured')} description={next.tier.restructuredCountsAsTierA ? t('ti.v.tierA') : t('ti.v.tierB')} />
        <Select label={t('ti.r.missed')} value={String(next.tier.missedPaymentsForTierB)} onChange={(e) => setTier({ missedPaymentsForTierB: Number(e.target.value) })} options={[1, 2, 3].map((n) => ({ value: String(n), label: t('ti.v.orMore', { n }) }))} />
        <Select
          label={t('ti.r.partnerRoles')}
          value={next.tierB.partnerRoles}
          onChange={(e) => setTierB({ partnerRoles: e.target.value as ProgrammeSettings['tierB']['partnerRoles'] })}
          options={[
            { value: 'earlyAccessWindow', label: t('ti.v.window', { days: next.tierB.earlyAccessDays }) },
            { value: 'hidden', label: t('ti.v.hidden') },
          ]}
        />
        {next.tierB.partnerRoles === 'earlyAccessWindow' && <Field label={t('ti.windowDays')} type="number" min={1} max={60} value={next.tierB.earlyAccessDays} onChange={(e) => setTierB({ earlyAccessDays: Number(e.target.value) || 1 })} />}
        <Select
          label={t('ti.r.courses')}
          value={next.tierB.courses}
          onChange={(e) => setTierB({ courses: e.target.value as ProgrammeSettings['tierB']['courses'] })}
          options={[
            { value: 'freePlusPreviews', label: t('ti.v.freePlusPreviews') },
            { value: 'freeOnly', label: t('ti.v.freeOnly') },
          ]}
        />

        <div>
          <SectionLabel className="mb-2">{t('ti.impact')}</SectionLabel>
          <dl className="grid grid-cols-2 gap-3">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-control bg-surface-muted p-3">
                <dt className="t-caption text-ink-2">{k}</dt>
                <dd className="mt-1 t-heading">{formatNumber(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <SectionLabel className="mb-2">{t('ti.notice')}</SectionLabel>
          <Note tone="info">{t('ti.noticeText')}</Note>
        </div>
      </div>
    </SidePanel>
  )
}
