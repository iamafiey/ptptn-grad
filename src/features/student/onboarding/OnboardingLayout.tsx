import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { useStudentShell } from '../shell/context'
import { ONBOARDING_STEPS } from './steps'

/**
 * Onboarding frame: back, step progress, Demo; title + lead; body; sticky footer for the one primary action.
 * `bare` drops the title block for full-bleed steps (reveal).
 */
export function OnboardingLayout({ stepId, title, lead, children, footer, hideBack }: { stepId: string; title?: ReactNode; lead?: string; children: ReactNode; footer?: ReactNode; hideBack?: boolean }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { openDemo } = useStudentShell()
  const index = Math.max(0, ONBOARDING_STEPS.findIndex((s) => s.id === stepId))
  const total = ONBOARDING_STEPS.length

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 bg-canvas/90 px-5 pt-[var(--safe-top)] backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3">
          <IconButton
            label={t('onboarding.back')}
            className={cn(hideBack && 'invisible')}
            onClick={() => (index === 0 ? navigate(-1) : navigate(`/s/onboarding/${ONBOARDING_STEPS[index - 1].id}`))}
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </IconButton>
          <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={t('onboarding.step', { n: index + 1, total })}>
            {ONBOARDING_STEPS.map((s, i) => (
              <span key={s.id} className={cn('h-1 flex-1 rounded-sm transition-colors', i <= index ? 'bg-ink' : 'bg-hairline')} />
            ))}
          </div>
          <button onClick={openDemo} className="h-8 rounded-control border border-hairline bg-surface px-2.5 t-caption text-ink-2 shadow-1 xl:hidden">
            {t('demo.button')}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-6">
        {title && (
          <div className="pb-6 pt-4">
            <p className="t-caption text-ink-2">{t('onboarding.step', { n: index + 1, total })}</p>
            <h1 className="mt-1 t-display-l">{title}</h1>
            {lead && <p className="mt-2 t-body text-ink-2">{lead}</p>}
          </div>
        )}
        {children}
      </main>

      {footer && <div className="sticky bottom-0 z-20 border-t border-hairline bg-canvas/95 px-5 pb-[calc(16px+var(--safe-bottom))] pt-3 backdrop-blur-sm">{footer}</div>}
    </div>
  )
}
