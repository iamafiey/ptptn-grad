import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, Eye, GraduationCap, Pencil } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toggle } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Rings'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Textarea'
import { IconTile } from '@/components/ui/Tiles'
import { SkillCard } from '@/components/student/SkillCard'
import { useT } from '@/i18n'
import { toEmployerView } from '@/services/profile'
import { studentHomePath, updateStudent } from '@/services/students'
import { AI_VERSIONS, listCategories, skillById } from '@/services/taxonomy'
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

/** Skill profile: summary, skills by category or level, timeline linked to skills, See as employer, skill CV. */
export default function ProfilePage() {
  const { t, lt } = useT()
  const navigate = useNavigate()
  const { id, data } = useStudent()
  const [employer, setEmployer] = useState(false)
  const [sort, setSort] = useState<'category' | 'level'>('category')
  const [openSkill, setOpenSkill] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const skills = useMemo(() => data?.skills ?? [], [data])
  const groups = useMemo(() => {
    if (sort === 'level') return LEVEL_ORDER.map((l) => ({ key: l, label: t(`skill.level.${l}`), skills: skills.filter((s) => s.level === l) })).filter((g) => g.skills.length)
    return listCategories()
      .map((c) => ({ key: c.id, label: lt(c.name), skills: skills.filter((s) => skillById(s.skillId)?.categoryId === c.id).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)) }))
      .filter((g) => g.skills.length)
  }, [skills, sort, t, lt])

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

          {/* Skills */}
          <section>
            <SectionLabel className="mb-3">{t('profile.skills')}</SectionLabel>
            <SegmentedControl
              ariaLabel={t('profile.skills')}
              value={sort}
              onChange={setSort}
              options={[
                { value: 'category', label: t('profile.sort.category') },
                { value: 'level', label: t('profile.sort.level') },
              ]}
            />
            {hiddenCount > 0 && <p className="mt-3 t-caption font-normal text-ink-2">{t('profile.hiddenCount', { count: hiddenCount })}</p>}
            <div className="mt-4 space-y-6">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="mb-2 t-caption text-ink-2">{g.label}</p>
                  <ul className="space-y-3">
                    {g.skills.map((sk) => {
                      const chip = statusChip(sk)
                      return (
                        <li key={sk.skillId}>
                          <SkillCard
                            name={name(sk.skillId)}
                            level={sk.level}
                            evidenceCount={sk.evidenceIds.length}
                            rationale={lt(sk.rationale)}
                            muted={sk.status === 'hidden'}
                            badge={chip && <Chip tone={chip.tone} size="sm">{t(chip.key)}</Chip>}
                            onOpen={() => setOpenSkill(sk.skillId)}
                          />
                        </li>
                      )
                    })}
                  </ul>
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

      <Button block icon={<Download size={18} strokeWidth={1.5} />} onClick={() => navigate('/s/profile/cv')}>
        {t('profile.downloadCv')}
      </Button>

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
