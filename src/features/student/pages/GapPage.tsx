import { useState } from 'react'
import { useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LevelBar } from '@/components/ui/LevelBar'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { buildCatalogue } from '@/services/courses'
import { readDb } from '@/services/db'
import { delay } from '@/services/delay'
import { buildOpenJobs } from '@/services/jobs'
import { rankedGaps } from '@/services/matching'
import { skillById } from '@/services/taxonomy'
import { useDemo } from '@/state/DemoProvider'
import { CourseCard } from '../learn/CourseCard'
import { CourseSheet } from '../learn/CourseSheet'
import { StudentPage } from '../shell/StudentPage'
import { useStudent } from '../useStudent'

/** Gap view: current → target level, what it unlocks, and 2–4 courses that close it. */
export default function GapPage() {
  const { skillId = '' } = useParams()
  const { t, lt } = useT()
  const { settings } = useDemo()
  const { id } = useStudent()
  const [open, setOpen] = useState<string | null>(null)

  const { data } = useAsync(() => {
    const d = readDb()
    const skills = d.students[id]?.skills ?? []
    const gaps = rankedGaps(skills, d.partnerRoles.filter((r) => r.status === 'live'), buildOpenJobs(id, settings))
    const gap = gaps.find((g) => g.skillId === skillId)
    const mine = skills.find((s) => s.skillId === skillId)
    const courses = buildCatalogue(id, settings)
      .filter((c) => c.skillIds.includes(skillId))
      .sort((a, b) => ({ free: 0, subsidised: 1, paid: 2 })[a.cost] - ({ free: 0, subsidised: 1, paid: 2 })[b.cost])
      .slice(0, 4)
    return delay({ gap, current: mine?.level ?? null, courses }, 120)
  }, [id, skillId, settings])

  const skill = skillById(skillId)
  const current = data?.courses.find((c) => c.id === open) ?? null

  return (
    <StudentPage title={t('student.gap.title')} heading={skill ? lt(skill.name) : t('student.gap.title')}>
      {data && (
        <>
          <Card>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="t-caption text-ink-2">{t('gap.current')}</p>
                <p className="t-body-strong">{data.current ? t(`skill.level.${data.current}`) : t('home.snapshot.notYet')}</p>
                {data.current && <LevelBar level={data.current} label={t(`skill.level.${data.current}`)} className="mt-2" />}
              </div>
              <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
              <div>
                <p className="t-caption text-ink-2">{t('gap.target')}</p>
                <p className="t-body-strong">{data.gap ? t(`skill.level.${data.gap.targetLevel}`) : '—'}</p>
                {data.gap && <LevelBar level={data.gap.targetLevel} label={t(`skill.level.${data.gap.targetLevel}`)} className="mt-2" />}
              </div>
            </div>
            {data.gap ? (
              <Chip tone="done" className="mt-4">
                {t('gap.unlocks', { count: data.gap.unlocksMatches })}
              </Chip>
            ) : (
              <Note tone="done" className="mt-4">
                {t('gap.reached')}
              </Note>
            )}
            {skill && <p className="mt-3 t-caption font-normal text-ink-2">{lt(skill.definition)}</p>}
          </Card>

          <section className="space-y-3">
            <SectionLabel>{t('gap.options')}</SectionLabel>
            {data.courses.length === 0 ? <Note tone="muted">{t('gap.none')}</Note> : data.courses.map((c) => <CourseCard key={c.id} course={c} onOpen={() => setOpen(c.id)} />)}
          </section>
        </>
      )}
      <CourseSheet course={current} studentId={id} open={!!current} onClose={() => setOpen(null)} />
    </StudentPage>
  )
}
