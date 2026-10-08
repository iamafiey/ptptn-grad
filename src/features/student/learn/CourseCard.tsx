import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LogoTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { costLabel } from './cost'
import type { CourseView } from '@/services/courses'
import { skillById } from '@/services/taxonomy'

/** Course card: provider tile, title, the skill it closes, cost/duration/format, access state, progress. */
export function CourseCard({ course, onOpen, note }: { course: CourseView; onOpen: () => void; note?: string }) {
  const { t, lt } = useT()
  const e = course.enrolment
  return (
    <Card as="article">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start gap-3">
          <LogoTile monogram={course.provider.monogram} />
          <div className="min-w-0 flex-1">
            <p className="t-body-strong">{lt(course.title)}</p>
            <p className="t-caption font-normal text-ink-2">{course.provider.name}</p>
          </div>
        </div>
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
          {course.access === 'preview' && (
            <Chip tone="info" size="sm">
              {t('learn.preview')}
            </Chip>
          )}
          {course.access === 'locked' && (
            <Chip tone="muted" size="sm" icon={<Lock size={12} strokeWidth={1.5} />}>
              {t('learn.locked')}
            </Chip>
          )}
        </div>
        {e && e.status !== 'completed' && e.status !== 'external' && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-sm bg-hairline">
              <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${e.progressPct}%` }} />
            </div>
            <p className="mt-1 t-caption font-normal text-ink-2">{t('home.learning.progress', { pct: e.progressPct })}</p>
          </div>
        )}
        {note && <p className="mt-2 t-caption text-ink">{note}</p>}
      </button>
    </Card>
  )
}
