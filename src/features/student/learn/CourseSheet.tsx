import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Award, ExternalLink, Lock } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LevelBar } from '@/components/ui/LevelBar'
import { Note } from '@/components/ui/Note'
import { Sheet } from '@/components/ui/Sheet'
import { LogoTile } from '@/components/ui/Tiles'
import { useT } from '@/i18n'
import { completeCourse, continueCourse, courseThumb, enrol, MODULES, PREVIEW_PCT, type CourseView } from '@/services/courses'
import { skillById } from '@/services/taxonomy'
import type { RescoreResult } from '@/types/domain'
import { costLabel } from './cost'

type View = 'details' | 'completing' | 'result'

/** Enrol → learn (module by module) → complete → certificate attached → re-score. */
export function CourseSheet({ course, studentId, open, onClose }: { course: CourseView | null; studentId: string; open: boolean; onClose: () => void }) {
  const { t, lt } = useT()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [view, setView] = useState<View>('details')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RescoreResult | null>(null)

  const close = () => {
    onClose()
    setTimeout(() => {
      setView('details')
      setResult(null)
    }, 300)
  }
  if (!course) return null
  const e = course.enrolment
  const name = (id: string) => lt(skillById(id)?.name ?? { en: id })
  const module = e ? Math.min(MODULES, Math.floor(e.progressPct / PREVIEW_PCT) + 1) : 1
  const previewDone = course.access === 'preview' && (e?.progressPct ?? 0) >= PREVIEW_PCT

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    await fn()
    setBusy(false)
  }
  const complete = async () => {
    setView('completing')
    const r = await completeCourse(studentId, course.id)
    setResult(r)
    setView('result')
  }

  let footer: React.ReactNode
  if (view === 'result')
    footer = (
      <Button block onClick={() => navigate('/s/profile')}>
        {t('learn.viewProfile')}
      </Button>
    )
  else if (view === 'completing') footer = undefined
  else if (course.access === 'locked') footer = undefined
  else if (!e)
    footer = (
      <Button block loading={busy} onClick={() => act(() => enrol(studentId, course.id))}>
        {t('learn.enrol')}
      </Button>
    )
  else if (e.status === 'external')
    footer = (
      <div className="space-y-2">
        <Button block onClick={complete}>
          {t('learn.markComplete')}
        </Button>
        <Button block variant="secondary" icon={<ExternalLink size={16} strokeWidth={1.5} />}>
          {t('learn.openProvider')}
        </Button>
      </div>
    )
  else if (e.status === 'inProgress' && e.progressPct >= 100)
    footer = (
      <Button block icon={<Award size={18} strokeWidth={1.5} />} onClick={complete}>
        {t('learn.complete')}
      </Button>
    )
  else if (e.status === 'inProgress' && !previewDone)
    footer = (
      <Button block loading={busy} onClick={() => act(() => continueCourse(studentId, course.id, course.access))}>
        {t('learn.continue', { n: module })}
      </Button>
    )

  return (
    <Sheet open={open} onClose={close} title={lt(course.title)} closeLabel={t('action.close')} footer={footer}>
      {view === 'details' && (
        <div className="space-y-5">
          <img src={courseThumb(course)} alt="" className="aspect-video w-full rounded-card bg-surface-muted object-cover" />
          <div className="flex items-center gap-3">
            <LogoTile monogram={course.provider.monogram} />
            <div>
              <p className="t-body-strong">{course.provider.name}</p>
              <p className="t-caption font-normal text-ink-2">{course.hosted ? t('learn.hosted') : t('learn.external')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={course.cost === 'free' ? 'done' : 'muted'} size="sm">
              {costLabel(t, course)}
            </Chip>
            <Chip tone="muted" size="sm">
              {t('learn.hours', { count: course.durationHours })}
            </Chip>
            <Chip tone="muted" size="sm">
              {t(`learn.format.${course.format}`)}
            </Chip>
            <Chip tone="outline" size="sm">
              {t('learn.certificate')}: {course.certificate}
            </Chip>
          </div>
          <ul className="space-y-2">
            {course.skillIds.map((s) => (
              <li key={s} className="flex items-center gap-3 rounded-control bg-surface-muted p-3">
                <span className="flex-1 t-body">{t('learn.levelCap', { skill: name(s), level: t(`skill.level.${course.levelCap}`) })}</span>
                <LevelBar level={course.levelCap} label={t(`skill.level.${course.levelCap}`)} className="w-14" />
              </li>
            ))}
          </ul>
          {course.access === 'locked' && <Note tone="muted" icon={<Lock size={14} strokeWidth={1.5} />}>{t('learn.lockedNote')}</Note>}
          {course.access === 'preview' && <Note>{previewDone ? t('learn.previewEnd') : t('learn.previewNote')}</Note>}
          {e?.status === 'external' && <Note tone="muted">{t('learn.tracking')}</Note>}
          {e?.status === 'inProgress' && (
            <div>
              <div className="flex justify-between t-caption">
                <span className="text-ink-2">{t('learn.progress', { n: Math.min(MODULES, Math.ceil(e.progressPct / PREVIEW_PCT) || 0), total: MODULES })}</span>
                <span className="tabular">{e.progressPct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-hairline" role="progressbar" aria-valuenow={e.progressPct} aria-valuemin={0} aria-valuemax={100}>
                <motion.div className="h-full bg-ink" initial={false} animate={{ width: `${e.progressPct}%` }} transition={{ duration: reduce ? 0 : 0.4 }} />
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'completing' && (
        <div className="py-10 text-center">
          <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-sm bg-hairline" aria-hidden>
            <motion.div className="h-full w-1/3 bg-ink" animate={reduce ? { opacity: [0.4, 1] } : { x: ['-100%', '300%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <p className="mt-4 t-body text-ink-2" role="status">
            {t('learn.completing')}
          </p>
        </div>
      )}

      {view === 'result' && result && (
        <div className="space-y-4">
          <Chip tone="done" icon={<Award size={14} strokeWidth={1.5} />}>
            {t('learn.certAttached', { skill: name(result.skillId) })}
          </Chip>
          <Card className="bg-surface-muted shadow-none">
            <p className="t-heading" role="status">
              {t('learn.rescored', { skill: name(result.skillId), from: t(`skill.level.${result.from}`), to: t(`skill.level.${result.to}`) })}
            </p>
            <LevelBar level={result.to} label={t(`skill.level.${result.to}`)} className="mt-3" />
          </Card>
          <p className="t-subheading">
            {result.newMatches > 0 ? (
              <>
                <AnimatedNumber value={result.newMatches} from={0} /> {t('learn.newMatches', { count: result.newMatches }).replace(/^\d+\s/, '')}
              </>
            ) : (
              t('learn.noNewMatches')
            )}
          </p>
        </div>
      )}
    </Sheet>
  )
}
