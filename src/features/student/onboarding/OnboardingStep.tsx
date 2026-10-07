import { useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { PhasePlaceholder } from '@/components/PhasePlaceholder'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { useStudentShell } from '../shell/context'
import { ONBOARDING_STEPS } from './steps'

/** Phase 1b: clickable onboarding skeleton (back, progress, one primary action per step). */
export default function OnboardingStep() {
  const { t } = useT()
  const navigate = useNavigate()
  const { openDemo } = useStudentShell()
  const { step } = useParams()
  const index = Math.max(0, ONBOARDING_STEPS.findIndex((s) => s.id === step))
  const current = ONBOARDING_STEPS[index]
  const last = index === ONBOARDING_STEPS.length - 1
  const total = ONBOARDING_STEPS.length

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-[calc(24px+var(--safe-bottom))] pt-[calc(8px+var(--safe-top))]">
      <header className="flex h-14 items-center gap-3">
        <IconButton label={t('onboarding.back')} onClick={() => (index === 0 ? navigate('/s/home') : navigate(`/s/onboarding/${ONBOARDING_STEPS[index - 1].id}`))}>
          <ArrowLeft size={20} strokeWidth={1.5} />
        </IconButton>
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={t('onboarding.step', { n: index + 1, total })}>
          {ONBOARDING_STEPS.map((s, i) => (
            <span key={s.id} className={cn('h-1 flex-1 rounded-sm', i <= index ? 'bg-ink' : 'bg-hairline')} />
          ))}
        </div>
        <button onClick={openDemo} className="h-8 rounded-control border border-hairline bg-surface px-2.5 t-caption text-ink-2 shadow-1 xl:hidden">
          {t('demo.button')}
        </button>
      </header>

      <p className="mt-6 t-caption text-ink-2">{t('onboarding.step', { n: index + 1, total })}</p>
      <h1 className="mt-1 t-display-l">{t(current.title)}</h1>

      <div className="mt-6 flex-1">
        <PhasePlaceholder phase={2} items={current.plan} />
      </div>

      <Button block className="mt-6" onClick={() => navigate(last ? '/s/home' : `/s/onboarding/${ONBOARDING_STEPS[index + 1].id}`)}>
        {last ? t('placeholder.finish') : t('placeholder.next')}
      </Button>
    </div>
  )
}
