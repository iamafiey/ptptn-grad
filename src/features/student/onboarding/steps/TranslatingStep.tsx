import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { translateSkills } from '@/services/skillTranslation'
import type { TranslationProgressEvent } from '@/types/domain'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

const PHASES = [
  { key: 'extract', stages: ['reading', 'extracting'] },
  { key: 'map', stages: ['mapping'] },
  { key: 'score', stages: ['scoring'] },
  { key: 'explain', stages: ['explaining'] },
] as const

/** Step 7: staged AI progress (~12 s), then on to the reveal. */
export function TranslatingStep({ state, next }: StepProps) {
  const { t, lt } = useT()
  const reduce = useReducedMotion()
  const [ev, setEv] = useState<TranslationProgressEvent | null>(null)
  const skip = useRef(false)
  const started = useRef(false)

  useEffect(() => {
    // Guard against StrictMode's double effect: one translation run per visit.
    if (started.current) return
    started.current = true
    translateSkills(state.student.id, setEv, { skip: () => skip.current }).then(() => next())
  }, [state.student.id, next])

  const activeIndex = ev ? PHASES.findIndex((p) => (p.stages as readonly string[]).includes(ev.stage)) : 0

  return (
    <OnboardingLayout stepId="translating" title={t('onboarding.translating.title')} lead={t('onb.translating.lead')} hideBack>
      <Card className="overflow-hidden">
        <div className="h-1.5 overflow-hidden rounded-sm bg-hairline" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ev?.pct ?? 0}>
          <motion.div className="h-full bg-ink" initial={{ width: 0 }} animate={{ width: `${ev?.pct ?? 4}%` }} transition={{ duration: reduce ? 0 : 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
        </div>
        <p className="mt-4 min-h-[44px] t-body-strong" role="status" aria-live="polite">
          {ev ? lt(ev.message) : '…'}
        </p>
      </Card>

      <ol className="mt-6 space-y-3">
        {PHASES.map((p, i) => {
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <li key={p.key} className={cn('flex gap-3 transition-opacity', !done && !active && 'opacity-50')}>
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-control t-caption tabular',
                  done ? 'bg-done text-done-ink' : active ? 'bg-ink text-on-ink' : 'bg-surface-muted text-ink-2',
                )}
              >
                {done ? <Check size={16} strokeWidth={2} /> : i + 1}
              </span>
              <span>
                <span className="block t-body-strong">{t(`explain.${p.key}.title`)}</span>
                <span className="block t-caption font-normal text-ink-2">{t(`explain.${p.key}.body`)}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 text-center">
        <Button variant="tertiary" size="sm" onClick={() => (skip.current = true)}>
          {t('onb.translating.skip')}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
