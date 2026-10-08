import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, Eye, GraduationCap, Pencil, Search, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toggle } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Rings'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Textarea'
import { IconTile } from '@/components/ui/Tiles'
import { SkillRow } from '@/components/student/SkillRow'
import { useT } from '@/i18n'
import { toEmployerView } from '@/services/profile'
import { studentHomePath, updateStudent } from '@/services/students'
import { AI_VERSIONS, categoryThumb, listCategories, skillById } from '@/services/taxonomy'
import { cn } from '@/lib/cn'
import type { Activity, ScoredSkill, SkillLevel } from '@/types/domain'
import { StudentPage } from '../shell/StudentPage'
import { EmployerPreview } from '../skills/EmployerPreview'
import { SkillSheet } from '../skills/SkillSheet'
import { statusChip } from '../skills/skillHelpers'
import { useStudent } from '../useStudent'

const LEVEL_ORDER: SkillLevel[] = ['advanced', 'working', 'foundation']

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
}

/** Skill profile: summary, skills (category tabs + search, compact rows), timeline linked to skills, See as employer, floating skill CV button. */
export default function ProfilePage() {
  const { t, lt } = useT()
  const navigate = useNavigate()
  const { id, data } = useStudent()
  const [employer, setEmployer] = useState(false)
  const [tab, setTab] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [openSkill, setOpenSkill] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const skills = useMemo(() => data?.skills ?? [], [data])
  // Category tabs (only categories the student has skills in), each with its count.
  const categories = useMemo(
    () =>
      listCategories()
        .map((c) => ({ id: c.id, label: lt(c.name), skills: skills.filter((s) => skillById(s.skillId)?.categoryId === c.id).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)) }))
        .filter((c) => c.skills.length),
    [skills, lt],
  )
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (sk: ScoredSkill) => !q || `${lt(skillById(sk.skillId)?.name ?? { en: sk.skillId })} ${lt(sk.rationale)}`.toLowerCase().includes(q)
    return categories.filter((c) => tab === 'all' || c.id === tab).map((c) => ({ ...c, skills: c.skills.filter(match) })).filter((c) => c.skills.length)
  }, [categories, tab, query, lt])

  if (!data) return <StudentPage title={t('student.profile.title')}>{null}</StudentPage>
  const s = data.student
  const name = (sid: string) => lt(skillById(sid)?.name ?? { en: sid })

  if (s.onboardingStep !== 'done' || !data.skills) {
    return (
      <StudentPage title={t('student.profile.title')}>
        <Card>
          <EmptyState title={t('profile.notReady')} action={<Button onClick={() => navigate(studentHomePath(id))}>{t('profile.continueOnboarding')}</Button>} />
        </Card>
      </StudentPage>
    )
  }

  const hiddenCount = skills.filter((x) => x.status === 'hidden' || x.status === 'disputed').length
  const activities = [...data.activities].sort((a, b) => b.startDate.localeCompare(a.startDate))
  const current: ScoredSkill | null = skills.find((x) => x.skillId === openSkill) ?? null

  return (
    <StudentPage title={t('student.profile.title')}>
      {/* Identity + strength */}
      <div className="flex items-center gap-4">
        <Avatar initials={s.avatarInitials} strength={data.strength.pct} size={76} label={t('settings.profileStrength', { pct: data.strength.pct })} />
        <div className="min-w-0">
          <p className="t-heading">{employer ? toEmployerView(s, skills).candidateCode : s.fullName}</p>
          <p className="t-caption font-normal text-ink-2">{s.programme}</p>
          <p className="t-caption font-normal text-ink-2">{s.institution}</p>
          <p className="mt-1 t-caption text-ink">{t('settings.profileStrength', { pct: data.strength.pct })}</p>
        </div>
      </div>

      <Card>
        <Toggle checked={employer} onChange={setEmployer} label={t('profile.seeAsEmployer')} description={t('employer.hidden')} />
      </Card>

      {employer ? (
        <>
          <Chip tone="ink" icon={<Eye size={14} strokeWidth={1.5} />}>
            {t('profile.employerBanner')}
          </Chip>
          <EmployerPreview profile={toEmployerView(s, skills)} />
        </>
      ) : (
        <>
          {/* Summary */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <SectionLabel>{t('profile.summary')}</SectionLabel>
              <IconButton
                label={t('profile.summary.edit')}
                size={32}
                onClick={() => {
                  setDraft(lt(s.summary))
                  setEditing(true)
                }}
              >
                <Pencil size={16} strokeWidth={1.5} />
              </IconButton>
            </div>
            <p className="mt-1 t-body">{lt(s.summary)}</p>
            <p className="mt-2 t-caption font-normal text-ink-3">{t('profile.summary.ai')}</p>
          </Card>

          {/* Skills: category tabs + search keep a long list short; rows open the skill sheet to edit. */}
          <section>
            <SectionLabel className="mb-3">
              {t('profile.skills')} · {skills.length}
            </SectionLabel>
            <label className="relative block">
              <span className="sr-only">{t('profile.searchSkills')}</span>
              <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('profile.searchSkills')}
                className="h-11 w-full rounded-control border border-hairline bg-surface pl-10 pr-10 t-body text-ink placeholder:text-ink-3"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label={t('profile.clearSearch')} className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-control text-ink-2 hover:text-ink">
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </label>
            <div role="tablist" aria-label={t('profile.skills')} className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none]">
              {[{ id: 'all', label: t('profile.tab.all'), count: skills.length }, ...categories.map((c) => ({ id: c.id, label: c.label, count: c.skills.length }))].map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={tab === c.id}
                  onClick={() => setTab(c.id)}
                  className={cn(
                    'h-9 shrink-0 whitespace-nowrap rounded-control border px-3 t-caption transition-colors',
                    tab === c.id ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-surface text-ink-2 hover:text-ink',
                  )}
                >
                  {c.label} <span className="tabular opacity-70">{c.count}</span>
                </button>
              ))}
            </div>
            {hiddenCount > 0 && <p className="mt-3 t-caption font-normal text-ink-2">{t('profile.hiddenCount', { count: hiddenCount })}</p>}
            <div className="mt-3 space-y-4">
              {groups.length === 0 && (
                <Card>
                  <EmptyState title={t('profile.noSkillMatch', { query })} />
                </Card>
              )}
              {groups.map((g) => (
                <div key={g.id}>
                  {tab === 'all' && <p className="mb-2 t-caption text-ink-2">{g.label}</p>}
                  <Card padded={false} className="divide-y divide-hairline overflow-hidden">
                    {g.skills.map((sk) => {
                      const chip = statusChip(sk)
                      return (
                        <SkillRow
                          key={sk.skillId}
                          name={name(sk.skillId)}
                          level={sk.level}
                          evidenceCount={sk.evidenceIds.length}
                          rationale={lt(sk.rationale)}
                          thumb={categoryThumb(g.id)}
                          muted={sk.status === 'hidden'}
                          badge={chip && <Chip tone={chip.tone} size="sm">{t(chip.key)}</Chip>}
                          onOpen={() => setOpenSkill(sk.skillId)}
                        />
                      )
                    })}
                  </Card>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <SectionLabel className="mb-3">{t('profile.timeline')}</SectionLabel>
            <ol className="relative space-y-3 border-l border-hairline pl-5">
              <li className="relative">
                <span className="absolute -left-[25px] top-4 h-2 w-2 rounded-circle bg-ink" aria-hidden />
                <Card className="flex gap-3">
                  <IconTile>
                    <GraduationCap size={20} strokeWidth={1.5} />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="t-caption text-ink-2">{t('profile.education')}</p>
                    <p className="t-body-strong">{s.programme}</p>
                    <p className="t-caption font-normal text-ink-2">
                      {s.institution} · {s.graduationYear}
                    </p>
                    {data.academic?.finalYearProject && (
                      <p className="mt-1 t-caption font-normal text-ink-2">
                        {t('onb.academic.fyp')}: {data.academic.finalYearProject.title}
                      </p>
                    )}
                  </div>
                </Card>
              </li>
              {activities.map((a: Activity) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-4 h-2 w-2 rounded-circle bg-ink-3" aria-hidden />
                  <Card>
                    <p className="t-caption text-ink-2">
                      {t(`kind.${a.kind}`)} · <span className="tabular">{fmtMonth(a.startDate)} – {a.endDate ? fmtMonth(a.endDate) : '…'}</span>
                    </p>
                    <p className="t-body-strong">{a.role}</p>
                    <p className="t-caption font-normal text-ink-2">{a.organisation}</p>
                    {a.skillIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.skillIds.map((sid) => (
                          <button key={sid} onClick={() => setOpenSkill(sid)} className="rounded-chip">
                            <Chip tone="muted" size="sm">
                              {name(sid)}
                            </Chip>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {/* How it works */}
          <Card>
            <SectionLabel>{t('profile.howItWorks')}</SectionLabel>
            <ol className="mt-3 space-y-3">
              {(['extract', 'map', 'score', 'explain'] as const).map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-control bg-surface-muted t-caption tabular">{i + 1}</span>
                  <span>
                    <span className="block t-body-strong">{t(`explain.${k}.title`)}</span>
                    <span className="block t-caption font-normal text-ink-2">{t(`explain.${k}.body`)}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 t-micro text-ink-3">{t('profile.versions', AI_VERSIONS)}</p>
          </Card>
        </>
      )}

      {/* Floats above the tab bar so it's always one tap away. */}
      <div className="sticky bottom-[calc(88px+var(--safe-bottom))] z-30 lg:bottom-6">
        <Button block className="shadow-2" icon={<Download size={18} strokeWidth={1.5} />} onClick={() => navigate('/s/profile/cv')}>
          {t('profile.downloadCv')}
        </Button>
      </div>

      <SkillSheet state={data} skill={current} open={!!current} onClose={() => setOpenSkill(null)} />
      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title={t('profile.summary.edit')}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            onClick={async () => {
              await updateStudent(id, { summary: { en: draft, ms: draft } })
              setEditing(false)
            }}
          >
            {t('action.save')}
          </Button>
        }
      >
        <Textarea label={t('profile.summary')} rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} hint={t('profile.summary.ai')} />
      </Sheet>
    </StudentPage>
  )
}
