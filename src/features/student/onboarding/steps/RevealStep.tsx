import { motion, useReducedMotion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { SkillCard } from '@/components/student/SkillCard'
import { useT } from '@/i18n'
import { STAGGER } from '@/lib/motion'
import { skillById } from '@/services/taxonomy'
import { OnboardingLayout } from '../OnboardingLayout'
import type { StepProps } from './types'

const SHOWN = 5

/** Step 8: the reveal — staggered skill cards over the Sunrise shimmer, ending on "We found N skills". */
export function RevealStep({ state, next }: StepProps) {
  const { t, lt } = useT()
  const reduce = useReducedMotion()
  const skills = state.skills ?? []
  const count = skills.length
  const words = t('onb.reveal.headline', { count: '§' }).split(/<em>|<\/em>/)

  return (
    <OnboardingLayout
      stepId="reveal"
      hideBack
      footer={
        <Button block onClick={next}>
          {t('onb.reveal.continue')}
        </Button>
      }
    >
      <div className="on-sunrise relative -mx-5 mt-1 overflow-hidden px-5 pb-8 pt-8" style={{ background: 'var(--sunrise)' }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: reduce ? undefined : 'shimmer 3.2s linear infinite',
          }}
          aria-hidden
        />
        <div className="relative">
          <Chip tone="ink" icon={<Sparkles size={14} strokeWidth={1.5} />}>
            {t('onboarding.reveal.title')}
          </Chip>
          <h1 className="mt-6 t-display-xl" aria-label={t('onb.reveal.headline', { count }).replace(/<\/?em>/g, '')}>
            {words[0]}
            <em>
              {words[1]?.split('§').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <AnimatedNumber value={count} from={0} />}
                </span>
              ))}
            </em>
            {words[2]}
          </h1>
          <p className="mt-2 t-body text-ink-2">{t('onb.reveal.sub', { activities: state.activities.length })}</p>

          <div className="mt-6 space-y-3">
            {skills.slice(0, SHOWN).map((s, i) => (
              <motion.div
                key={s.skillId}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1], delay: 0.4 + i * STAGGER }}
              >
                <SkillCard name={lt(skillById(s.skillId)?.name ?? { en: s.skillId })} level={s.level} evidenceCount={s.evidenceIds.length} rationale={lt(s.rationale)} />
              </motion.div>
            ))}
          </div>
          {count > SHOWN && <p className="mt-3 text-center t-caption text-ink-2">{t('onb.reveal.more', { count: count - SHOWN })}</p>}
        </div>
      </div>
    </OnboardingLayout>
  )
}
