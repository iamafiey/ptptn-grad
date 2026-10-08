import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { buildCatalogue, daysInactive } from '@/services/courses'
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

/** Learn: In progress, Recommended for your gaps, Completed (with certificates), Browse all. */
export default function LearnPage() {
  const { t, lt, lang } = useT()
  const { settings } = useDemo()
  const { id } = useStudent()
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const [open, setOpen] = useState<string | null>(null)

  const { data } = useAsync(() => {
    const d = readDb()
    const skills = d.students[id]?.skills ?? []
    const catalogue = buildCatalogue(id, settings)
    const gaps = rankedGaps(skills, d.partnerRoles.filter((r) => r.status === 'live'), buildOpenJobs(id, settings))
    // One course per gap, skipping anything already started or already recommended.
    const used = new Set<string>()
    const recommended = gaps
      .map((g) => {
        const course = catalogue.find((c) => c.skillIds.includes(g.skillId) && !c.enrolment && c.access !== 'locked' && !used.has(c.id))
        if (course) used.add(course.id)
        return { gap: g, course }
      })
      .filter((r) => r.course)
      .slice(0, 3)
    return delay({ catalogue, recommended }, 150)
  }, [id, settings])

  const catalogue = data?.catalogue ?? []
  const inProgress = catalogue.filter((c) => c.enrolment && c.enrolment.status !== 'completed')
  const completed = catalogue.filter((c) => c.enrolment?.status === 'completed')
  const browse = catalogue.filter((c) => filter === 'all' || c.cost === 'free')
  const current = catalogue.find((c) => c.id === open) ?? null

  return (
    <StudentPage title={t('student.learn.title')}>
      <section className="space-y-3">
        <SectionLabel>{t('learn.inProgress')}</SectionLabel>
        {inProgress.length === 0 ? (
          <Card>
            <EmptyState title={t('learn.emptyInProgress')} />
          </Card>
        ) : (
          inProgress.map((c) => {
            const idle = c.enrolment ? daysInactive(c.enrolment) : 0
            return (
              <div key={c.id} className="space-y-2">
                <CourseCard course={c} onOpen={() => setOpen(c.id)} />
                {idle >= 5 && (
                  <Note tone="pending" icon={<BellRing size={14} strokeWidth={1.5} />}>
                    {t('learn.nudge', { days: idle, mins: 25 })}
                  </Note>
                )}
              </div>
            )
          })
        )}
      </section>

      {(data?.recommended.length ?? 0) > 0 && (
        <section className="space-y-3">
          <SectionLabel>{t('learn.recommended')}</SectionLabel>
          {data!.recommended.map(({ gap, course }) => (
            <CourseCard
              key={course!.id}
              course={course!}
              onOpen={() => setOpen(course!.id)}
              note={`${t('learn.gapFor', { skill: lt(skillById(gap.skillId)?.name ?? { en: gap.skillId }) })} · ${t('learn.opensRoles', { count: gap.unlocksMatches })}`}
            />
          ))}
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <SectionLabel>{t('learn.completed')}</SectionLabel>
          {completed.map((c) => (
            <CourseCard key={c.id} course={c} onOpen={() => setOpen(c.id)} note={`${t('learn.certificate')} · ${formatDate(c.enrolment!.lastActivityAt, lang, 'long')}`} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <SectionLabel>{t('learn.browse')}</SectionLabel>
        <SegmentedControl
          ariaLabel={t('learn.browse')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('learn.filter.all') },
            { value: 'free', label: t('learn.filter.free') },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          {browse.map((c) => (
            <CourseCard key={c.id} course={c} layout="tile" onOpen={() => setOpen(c.id)} />
          ))}
        </div>
      </section>

      <CourseSheet course={current} studentId={id} open={!!current} onClose={() => setOpen(null)} />
    </StudentPage>
  )
}
