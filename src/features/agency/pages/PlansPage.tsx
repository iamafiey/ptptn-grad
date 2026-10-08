import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Field, Toggle } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { ChangeRequestList } from '@/components/agency/ChangeRequestList'
import { SidePanel } from '@/components/agency/SidePanel'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { ContactChannel } from '@/config/programmeSettings'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { applyPlanChange, listPlans, proposePlan, simulatePlan, templateList, type FollowUpPlan, type PlanStep, type TemplateId } from '@/services/collections'
import type { ChangeRequest } from '@/services/db'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

const TEMPLATES = templateList()
const CHANNELS: ContactChannel[] = ['inApp', 'sms', 'email', 'whatsapp']

/** Follow-up plans per segment. Edits go through the two-person rule, then run automatically within caps. */
export default function PlansPage() {
  const { t, lt } = useT()
  const toast = useToast()
  const { settings } = useDemo()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => listPlans(settings), [settings])
  const [draft, setDraft] = useState<FollowUpPlan | null>(null)
  const canAct = !readOnly && (role === 'collectionLiaison' || role === 'superAdmin')
  const stepLabel = (s: PlanStep) => (s.kind === 'call' ? t('col.plan.call') : `${lt(TEMPLATES.find((x) => x.id === s.templateId)?.name ?? { en: '' })} · ${t(`col.channel.${s.channel ?? "inApp"}`)}`)

  const onApproved = (cr: ChangeRequest) => {
    applyPlanChange(cr)
    toast(t('col.plan.published'))
  }

  return (
    <AgencyPage title={t('agency.nav.plans')} description={t('col.pl.lead')}>
      <Note tone="muted" className="mb-4">
        {t('col.act.rules', { start: settings.collections.quietHours.start, end: settings.collections.quietHours.end, cap: settings.collections.contactCapPerWeek })}
      </Note>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card padded={false} className="overflow-hidden">
          <Table minWidth={760}>
            <THead>
              <Th>{t('col.col.segment')}</Th>
              <Th>{t('col.pl.steps')}</Th>
              <Th>{t('col.pl.inPlan')}</Th>
              <Th>{t('col.pl.results')}</Th>
              <Th>{t('col.pl.version')}</Th>
            </THead>
            <tbody>
              {(data ?? []).map(({ plan, inPlan, results }) => (
                <Tr key={plan.id} onClick={canAct ? () => setDraft(structuredClone(plan)) : undefined}>
                  <Td>
                    <span className="t-body-strong">{t(`col.seg.${plan.segment}`)}</span>
                    {!plan.active && (
                      <Chip tone="muted" size="sm" className="ml-2">
                        {t('col.pl.off')}
                      </Chip>
                    )}
                  </Td>
                  <Td>
                    <ol className="space-y-0.5 t-caption text-ink-2">
                      {plan.steps.map((s, i) => (
                        <li key={i}>
                          {t('col.plan.day', { day: s.day })} · {stepLabel(s)}
                        </li>
                      ))}
                    </ol>
                  </Td>
                  <Td className="tabular">{inPlan}</Td>
                  <Td className="tabular whitespace-nowrap">{results.paidWithin30 ? t('col.pl.paidPct', { pct: Math.round((results.paidWithin30 / results.entered) * 100) }) : t('col.pl.noPayGoal')}</Td>
                  <Td className="tabular">v{plan.version}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="min-w-0">
          <ChangeRequestList kind="plan" officer={officer} canAct={canAct} onApproved={onApproved} />
        </div>
      </div>
      <p className="mt-3 t-caption font-normal text-ink-3">{t('col.pl.resultsNote')}</p>

      <PlanEditor
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSubmit={async () => {
          if (!draft) return
          const r = await proposePlan(officer, draft, settings)
          setDraft(null)
          toast(r === 'published' ? t('col.plan.published') : t('col.pl.proposed'))
        }}
      />
    </AgencyPage>
  )
}

function PlanEditor({ draft, onChange, onClose, onSubmit }: { draft: FollowUpPlan | null; onChange: (p: FollowUpPlan) => void; onClose: () => void; onSubmit: () => void }) {
  const { t, lt } = useT()
  const { settings } = useDemo()
  const sim = draft ? simulatePlan(draft, settings) : null
  const setStep = (i: number, patch: Partial<PlanStep>) => draft && onChange({ ...draft, steps: draft.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  return (
    <SidePanel
      open={!!draft}
      onClose={onClose}
      title={draft ? t(`col.seg.${draft.segment}`) : ''}
      subtitle={draft ? `${draft.id} · v${draft.version}` : undefined}
      closeLabel={t('action.close')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button size="sm" disabled={!!sim?.overCap} onClick={onSubmit}>
            {settings.collections.planApproval === 'single' ? t('col.pl.publish') : t('col.pl.submit')}
          </Button>
        </div>
      }
    >
      {draft && sim && (
        <div className="space-y-5">
          <Toggle checked={draft.active} onChange={(v) => onChange({ ...draft, active: v })} label={t('col.pl.active')} description={t('col.pl.activeHint')} />
          <div>
            <SectionLabel className="mb-3">{t('col.pl.steps')}</SectionLabel>
            <ol className="space-y-3">
              {draft.steps.map((s, i) => (
                <li key={i} className="rounded-control border border-hairline p-3">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-end gap-2">
                    <Field type="number" label={t('col.pl.day')} min={0} max={30} value={s.day} onChange={(e) => setStep(i, { day: Math.max(0, Number(e.target.value) || 0) })} />
                    <Select size="sm" label={t('col.pl.kind')} value={s.kind} onChange={(e) => setStep(i, e.target.value === 'call' ? { kind: 'call', channel: undefined, templateId: undefined } : { kind: 'message', channel: 'inApp', templateId: TEMPLATES[0].id })} options={[{ value: 'message', label: t('col.pl.message') }, { value: 'call', label: t('col.plan.call') }]} />
                    <IconButton label={t('col.pl.remove')} size={36} onClick={() => onChange({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}>
                      <Trash2 size={16} strokeWidth={1.5} />
                    </IconButton>
                  </div>
                  {s.kind === 'message' && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <Select size="sm" label={t('col.act.template')} value={s.templateId} onChange={(e) => setStep(i, { templateId: e.target.value as TemplateId })} options={TEMPLATES.map((x) => ({ value: x.id, label: lt(x.name) }))} />
                      <Select size="sm" label={t('col.act.channel')} value={s.channel} onChange={(e) => setStep(i, { channel: e.target.value as ContactChannel })} options={CHANNELS.map((c) => ({ value: c, label: t(`col.channel.${c}`) }))} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              icon={<Plus size={14} strokeWidth={1.5} />}
              onClick={() => onChange({ ...draft, steps: [...draft.steps, { day: (draft.steps.at(-1)?.day ?? 0) + 3, kind: 'message', channel: 'inApp', templateId: TEMPLATES[0].id }] })}
            >
              {t('col.pl.addStep')}
            </Button>
          </div>
          <div className="rounded-control bg-surface-muted p-4">
            <SectionLabel className="mb-2">{t('col.pl.simulate')}</SectionLabel>
            <p className="t-body-sm">{t('col.pl.sim', { entering: formatNumber(sim.entering), messages: formatNumber(sim.messages), calls: formatNumber(sim.calls) })}</p>
          </div>
          {sim.overCap ? <Note tone="attention">{t('col.pl.overCap', { cap: sim.maxPerWeek })}</Note> : <Note tone="muted">{settings.collections.planApproval === 'single' ? t('col.pl.single') : t('col.pl.twoPerson')}</Note>}
        </div>
      )}
    </SidePanel>
  )
}
