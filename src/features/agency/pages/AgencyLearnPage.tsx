import { useState } from 'react'
import { AlertTriangle, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Field } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { SidePanel } from '@/components/agency/SidePanel'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { addCourse, gapInsights, listCatalogueAdmin, setCourseStatus, suggestSkills, type CourseDraft } from '@/services/coursesAdmin'
import { skillById } from '@/services/taxonomy'
import type { Course } from '@/types/domain'
import { costLabel } from '@/features/student/learn/cost'
import { AgencyPage } from '../shell/AgencyPage'
import { useOfficer } from '../useOfficer'

type Tab = 'catalogue' | 'providers' | 'gaps'
const STATUS_TONE: Record<Course['status'], ChipTone> = { draft: 'muted', live: 'done', paused: 'pending', retired: 'muted' }
const SAMPLE_SYLLABUS = 'Hands-on report writing for graduates: structure a business report, write an executive summary, present findings from data analysis to managers.'
const EMPTY: CourseDraft = { title: '', providerId: '', skillIds: [], levelCap: 'working', durationHours: 8, cost: 'free', costRM: 0, format: 'selfPaced', tierAccess: 'all', certificate: '' }

/** Learn catalogue: every course maps to taxonomy skills. Add course with AI-suggested skills; providers; gap insights. */
export default function AgencyLearnPage() {
  const { t, lt } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const { data } = useAsync(() => listCatalogueAdmin(), [])
  const [tab, setTab] = useState<Tab>('catalogue')
  const [adding, setAdding] = useState(false)
  const canAct = !readOnly && (role === 'learningManager' || role === 'superAdmin')
  const providers = data?.providers ?? []
  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? id
  const skillName = (id: string) => lt(skillById(id)?.name ?? { en: id })

  return (
    <AgencyPage
      title={t('agency.nav.learn')}
      description={t('le.lead')}
      actions={
        canAct && (
          <Button size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => setAdding(true)}>
            {t('le.add')}
          </Button>
        )
      }
    >
      <SegmentedControl<Tab>
        ariaLabel={t('agency.nav.learn')}
        className="mb-4 w-full max-w-md"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'catalogue', label: t('le.tab.catalogue') },
          { value: 'providers', label: t('le.tab.providers') },
          { value: 'gaps', label: t('le.tab.gaps') },
        ]}
      />

      {tab === 'catalogue' && (
        <Card padded={false} className="overflow-hidden">
          <Table minWidth={1120}>
            <THead>
              <Th>{t('le.col.course')}</Th>
              <Th>{t('le.col.provider')}</Th>
              <Th>{t('le.col.skills')}</Th>
              <Th>{t('le.col.cap')}</Th>
              <Th>{t('le.col.duration')}</Th>
              <Th>{t('le.col.cost')}</Th>
              <Th>{t('le.col.tier')}</Th>
              <Th className="text-right">{t('le.col.enrolments')}</Th>
              <Th className="text-right">{t('le.col.completion')}</Th>
              <Th>{t('le.col.status')}</Th>
            </THead>
            <tbody>
              {(data?.courses ?? []).map((c) => (
                <Tr key={c.id}>
                  <Td className="t-body-strong">{lt(c.title)}</Td>
                  <Td>{providerName(c.providerId)}</Td>
                  <Td className="max-w-[220px]">{c.skillIds.map(skillName).join(', ')}</Td>
                  <Td>{t(`skill.level.${c.levelCap}`)}</Td>
                  <Td className="tabular whitespace-nowrap">{t('le.hours', { h: c.durationHours })}</Td>
                  <Td className="whitespace-nowrap">{costLabel(t, c)}</Td>
                  <Td className="whitespace-nowrap">{t(`le.tier.${c.tierAccess}`)}</Td>
                  <Td className="tabular text-right">{formatNumber(c.enrolments)}</Td>
                  <Td className="tabular text-right">{Math.round(c.completionRate * 100)}%</Td>
                  <Td>
                    {canAct ? (
                      <Select
                        size="sm"
                        label={t('le.col.status')}
                        hideLabel
                        className="w-28"
                        value={c.status}
                        onChange={async (e) => {
                          await setCourseStatus(officer, c.id, e.target.value as Course['status'])
                          toast(t('ag.done'))
                        }}
                        options={(['draft', 'live', 'paused', 'retired'] as const).map((s) => ({ value: s, label: t(`le.status.${s}`) }))}
                      />
                    ) : (
                      <Chip tone={STATUS_TONE[c.status]} size="sm">
                        {t(`le.status.${c.status}`)}
                      </Chip>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'providers' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} as="article">
              <div className="flex items-center gap-3">
                <LogoTile monogram={p.monogram} />
                <div className="min-w-0 flex-1">
                  <p className="t-body-strong">{p.name}</p>
                  {p.flagged && (
                    <Chip tone="attention" size="sm" icon={<AlertTriangle size={11} strokeWidth={1.5} />}>
                      {t('le.provider.flagged')}
                    </Chip>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <dt className="t-caption text-ink-2">{t('le.provider.rating')}</dt>
                  <dd className="tabular">{p.rating.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="t-caption text-ink-2">{t('le.col.completion')}</dt>
                  <dd className="tabular">{Math.round(p.completionRate * 100)}%</dd>
                </div>
                <div>
                  <dt className="t-caption text-ink-2">{t('le.provider.courses')}</dt>
                  <dd className="tabular">{(data?.courses ?? []).filter((c) => c.providerId === p.id).length}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      {tab === 'gaps' && <GapInsights />}

      <AddCourse open={adding} onClose={() => setAdding(false)} providers={providers.map((p) => ({ value: p.id, label: p.name }))} onSave={async (d) => {
        await addCourse(officer, d)
        setAdding(false)
        toast(t('le.published'))
      }} />
    </AgencyPage>
  )
}

function GapInsights() {
  const { t, lt } = useT()
  const rows = gapInsights()
  const max = Math.max(...rows.map((r) => r.score))
  return (
    <Card padded={false} className="overflow-hidden">
      <Table minWidth={560}>
        <THead>
          <Th>{t('le.gap.skill')}</Th>
          <Th>{t('le.gap.demand')}</Th>
          <Th className="text-right">{t('le.gap.courses')}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.skillId}>
              <Td>
                {lt(skillById(r.skillId)?.name ?? { en: r.skillId })}
                {r.uncovered && r.highDemand && (
                  <Chip tone="attention" size="sm" className="ml-2">
                    {t('le.gap.uncovered')}
                  </Chip>
                )}
              </Td>
              <Td className="w-1/2">
                <div className="h-2 rounded-chip bg-surface-muted">
                  <div className="h-2 rounded-chip" style={{ width: `${(r.score / max) * 100}%`, background: 'var(--series-1)' }} />
                </div>
              </Td>
              <Td className="tabular text-right">{r.courses}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function AddCourse({ open, onClose, providers, onSave }: { open: boolean; onClose: () => void; providers: { value: string; label: string }[]; onSave: (d: CourseDraft) => void }) {
  const { t, lt } = useT()
  const [d, setD] = useState<CourseDraft>(EMPTY)
  const [syllabus, setSyllabus] = useState('')
  const [suggested, setSuggested] = useState<{ skillId: string; confidence: number }[] | null>(null)
  const set = (patch: Partial<CourseDraft>) => setD((x) => ({ ...x, ...patch }))
  const valid = d.title.trim() && d.skillIds.length > 0 && d.certificate.trim()
  const close = () => {
    setD(EMPTY)
    setSyllabus('')
    setSuggested(null)
    onClose()
  }

  return (
    <SidePanel
      open={open}
      onClose={close}
      title={t('le.add')}
      closeLabel={t('ag.panel.close')}
      footer={
        <div className="flex justify-end">
          <Button size="sm" disabled={!valid} onClick={() => {
              onSave({ ...d, providerId: d.providerId || providers[0]?.value })
              setD(EMPTY)
              setSyllabus('')
              setSuggested(null)
            }}>
            {t('le.form.publish')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label={t('le.form.title')} value={d.title} onChange={(e) => set({ title: e.target.value })} />
        <Select label={t('le.form.provider')} value={d.providerId || providers[0]?.value} onChange={(e) => set({ providerId: e.target.value })} options={providers} />
        <Textarea label={t('le.form.syllabus')} value={syllabus} onChange={(e) => setSyllabus(e.target.value)} rows={3} hint={t('le.form.syllabusHint')} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} strokeWidth={1.5} />}
            onClick={() => {
              const text = syllabus.trim() || SAMPLE_SYLLABUS
              if (!syllabus.trim()) setSyllabus(SAMPLE_SYLLABUS)
              const s = suggestSkills(text)
              setSuggested(s)
              set({ skillIds: s.map((x) => x.skillId) })
            }}
          >
            {t('le.form.suggest')}
          </Button>
        </div>
        {suggested && (
          <div>
            {suggested.length === 0 ? (
              <Note tone="muted">{t('le.form.noSuggestion')}</Note>
            ) : (
              <ChipSelect
                multiple
                label={t('le.form.suggested')}
                value={d.skillIds}
                onChange={(v) => set({ skillIds: v })}
                options={suggested.map((s) => ({ value: s.skillId, label: `${lt(skillById(s.skillId)?.name ?? { en: s.skillId })} · ${s.confidence.toFixed(2)}` }))}
              />
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('le.form.cap')} value={d.levelCap} onChange={(e) => set({ levelCap: e.target.value as CourseDraft['levelCap'] })} options={(['foundation', 'working', 'advanced'] as const).map((l) => ({ value: l, label: t(`skill.level.${l}`) }))} />
          <Field label={t('le.form.hours')} type="number" min={1} value={d.durationHours} onChange={(e) => set({ durationHours: Number(e.target.value) || 1 })} />
          <Select label={t('le.form.cost')} value={d.cost} onChange={(e) => set({ cost: e.target.value as CourseDraft['cost'] })} options={(['free', 'subsidised', 'paid'] as const).map((c) => ({ value: c, label: t(`le.cost.${c}`) }))} />
          {d.cost !== 'free' && <Field label={t('le.form.price')} type="number" min={0} value={d.costRM ?? 0} onChange={(e) => set({ costRM: Number(e.target.value) })} />}
          <Select label={t('le.form.format')} value={d.format} onChange={(e) => set({ format: e.target.value as CourseDraft['format'] })} options={(['selfPaced', 'live', 'blended'] as const).map((f) => ({ value: f, label: t(`learn.format.${f}`) }))} />
          <Select label={t('le.form.tier')} value={d.tierAccess} onChange={(e) => set({ tierAccess: e.target.value as CourseDraft['tierAccess'] })} options={(['all', 'tierAFullTierBPreview', 'tierAOnly'] as const).map((x) => ({ value: x, label: t(`le.tier.${x}`) }))} />
        </div>
        <Field label={t('le.form.certificate')} value={d.certificate} onChange={(e) => set({ certificate: e.target.value })} />
      </div>
    </SidePanel>
  )
}
