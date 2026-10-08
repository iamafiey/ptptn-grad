import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useT } from '@/i18n'
import { courseThumb, type CourseView } from '@/services/courses'
import { skillById } from '@/services/taxonomy'
import { costLabel } from './cost'

/** 16:9 course illustration with the access state (preview / locked) pinned to its corner. */
function CourseThumb({ course }: { course: CourseView }) {
  const { t } = useT()
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-surface-muted">
      <img src={courseThumb(course)} alt="" className="h-full w-full object-cover" />
      {course.access === 'preview' && (
        <Chip tone="info" size="sm" className="absolute left-2 top-2">
          {t('learn.preview')}
        </Chip>
      )}
      {course.access === 'locked' && (
        <Chip tone="ink" size="sm" className="absolute left-2 top-2" icon={<Lock size={12} strokeWidth={1.5} />} title={t('learn.locked')}>
          {t('learn.lockedBadge')}
        </Chip>
      )}
    </div>
  )
}

/**
 * Course card with a thumbnail on top (scan by picture, then read).
 * `layout="tile"` is the compact grid version used in Browse all.
 */
export function CourseCard({ course, onOpen, note, layout = 'full' }: { course: CourseView; onOpen: () => void; note?: string; layout?: 'full' | 'tile' }) {
  const { t, lt } = useT()
  const e = course.enrolment
  const inProgress = e && e.status !== 'completed' && e.status !== 'external'

  if (layout === 'tile')
    return (
      <Card as="article" padded={false} className="overflow-hidden">
        <button onClick={onOpen} className="flex h-full w-full flex-col text-left">
          <CourseThumb course={course} />
          <div className="flex flex-1 flex-col gap-1 p-3">
            <p className="line-clamp-2 t-body-strong">{lt(course.title)}</p>
            <p className="truncate t-caption font-normal text-ink-2">{course.provider.name}</p>
            <p className="mt-auto pt-1 t-caption text-ink-2">
              {costLabel(t, course)} · {t('learn.hours', { count: course.durationHours })}
            </p>
          </div>
        </button>
      </Card>
    )

  return (
    <Card as="article" padded={false} className="overflow-hidden">
      <button onClick={onOpen} className="block w-full text-left">
        <CourseThumb course={course} />
        <div className="p-4">
          <p className="t-body-strong">{lt(course.title)}</p>
          <p className="t-caption font-normal text-ink-2">{course.provider.name}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone={course.cost === 'free' ? 'done' : 'muted'} size="sm">
              {costLabel(t, course)}
            </Chip>
            <Chip tone="muted" size="sm">
              {t('learn.hours', { count: course.durationHours })}
            </Chip>
            {course.skillIds.slice(0, 2).map((s) => (
              <Chip key={s} tone="outline" size="sm">
                {lt(skillById(s)?.name ?? { en: s })}
              </Chip>
            ))}
          </div>
          {inProgress && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-sm bg-hairline">
                <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${e.progressPct}%` }} />
              </div>
              <p className="mt-1 t-caption font-normal text-ink-2">{t('home.learning.progress', { pct: e.progressPct })}</p>
            </div>
          )}
          {note && <p className="mt-2 t-caption text-ink">{note}</p>}
        </div>
      </button>
    </Card>
  )
}
